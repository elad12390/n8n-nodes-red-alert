import {
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

interface IRedAlert {
	id: string;
	cat: string;
	title: string;
	data: string[];
	desc: string;
	timestamp?: number;
}

interface ILocationData {
	label: string;
	value: string;
	areaid: number;
	areaname: string;
	label_he: string;
	migun_time: number;
	city_data?: {
		label: string;
		rashut: string;
		value: string;
		areaid: number;
		mixname: string;
		color: string;
	};
}

export class RedAlertTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Red Alert Trigger',
		name: 'redAlertTrigger',
		icon: 'file:red-alert.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers on Israeli Red Alert notifications from Pikud Ha\'Oref (Home Front Command)',
		defaults: {
			name: 'Red Alert Trigger',
		},
		inputs: [],
		// Explicitly cast to expected NodeConnectionType[] to satisfy TS
		outputs: ['main'] as any,
		properties: [
			{
				displayName: 'Trigger Mode',
				name: 'triggerMode',
				type: 'options',
				options: [
					{
						name: 'New Alerts Only',
						value: 'newAlerts',
						description: 'Trigger only when new alerts are detected',
					},
					{
						name: 'All Active Alerts',
						value: 'allAlerts',
						description: 'Trigger on all currently active alerts (periodic check)',
					},
					{
						name: 'Alert Status Changes',
						value: 'statusChange',
						description: 'Trigger when alert status changes (new alerts or alerts cleared)',
					},
				],
				default: 'newAlerts',
				description: 'How the trigger should respond to alerts',
			},
			{
				displayName: 'Check Interval (seconds)',
				name: 'checkInterval',
				type: 'number',
				default: 10,
				description: 'How often to check for new alerts (minimum 5 seconds)',
				typeOptions: {
					minValue: 5,
					maxValue: 300,
				},
			},
			{
				displayName: 'Filter by Location',
				name: 'filterByLocation',
				type: 'boolean',
				default: false,
				description: 'Whether to filter alerts by specific locations',
			},
			{
				displayName: 'Location Filter',
				name: 'locationFilter',
				type: 'string',
				default: '',
				placeholder: 'תל אביב, ירושלים, חיפה',
				description: 'Comma-separated list of locations to filter by (Hebrew names)',
				displayOptions: {
					show: {
						filterByLocation: [true],
					},
				},
			},
			{
				displayName: 'Filter by Area',
				name: 'filterByArea',
				type: 'boolean',
				default: false,
				description: 'Whether to filter alerts by specific areas',
			},
			{
				displayName: 'Area Filter',
				name: 'areaFilter',
				type: 'multiOptions',
				options: [
					{
						name: 'Gaza Envelope (עוטף עזה)',
						value: 'עוטף עזה',
					},
					{
						name: 'Tel Aviv (תל אביב)',
						value: 'תל אביב',
					},
					{
						name: 'Jerusalem (ירושלים)',
						value: 'ירושלים',
					},
					{
						name: 'North (צפון)',
						value: 'צפון',
					},
					{
						name: 'Center (מרכז)',
						value: 'מרכז',
					},
					{
						name: 'South (דרום)',
						value: 'דרום',
					},
				],
				default: [],
				description: 'Select specific areas to monitor',
				displayOptions: {
					show: {
						filterByArea: [true],
					},
				},
			},
			{
				displayName: 'Include Historical Context',
				name: 'includeHistory',
				type: 'boolean',
				default: false,
				description: 'Include recent alert history in the triggered data',
			},
			{
				displayName: 'Trigger on Clear',
				name: 'triggerOnClear',
				type: 'boolean',
				default: true,
				description: 'Trigger when all alerts are cleared (all-clear status)',
			},
			{
				displayName: 'Enhanced Location Data',
				name: 'enhancedLocationData',
				type: 'boolean',
				default: true,
				description: 'Include detailed location information (shelter times, coordinates, etc.)',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const triggerMode = this.getNodeParameter('triggerMode') as string;
		const checkInterval = Math.max(this.getNodeParameter('checkInterval') as number, 5) * 1000;
		const filterByLocation = this.getNodeParameter('filterByLocation') as boolean;
		const locationFilter = this.getNodeParameter('locationFilter') as string;
		const filterByArea = this.getNodeParameter('filterByArea') as boolean;
		const areaFilter = this.getNodeParameter('areaFilter') as string[];
		const includeHistory = this.getNodeParameter('includeHistory') as boolean;
		const triggerOnClear = this.getNodeParameter('triggerOnClear') as boolean;
		const enhancedLocationData = this.getNodeParameter('enhancedLocationData') as boolean;

		let intervalId: NodeJS.Timeout;
		let lastAlertId: string | null = null;
		let lastAlertCount = 0;
		let isFirstCheck = true;

		// Parse location filters
		const locationFilters = filterByLocation && locationFilter
			? locationFilter.split(',').map(loc => loc.trim())
			: [];

		const alertsUrl = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
		const historyUrl = 'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json';

		const startConsumer = async () => {
			this.logger.info('Red Alert Trigger: Starting monitoring for Israeli alerts');

			const checkForAlerts = async () => {
				try {
					// Get current alerts
					const response = await axios.get(alertsUrl, {
						timeout: 30000,
						headers: {
							'User-Agent': 'n8n-red-alert-trigger/1.0',
						},
					});

					let currentAlerts: IRedAlert | null = null;
					
					// Check if there's alert data
					if (response.data && typeof response.data === 'object' && response.data.id) {
						currentAlerts = response.data as IRedAlert;
						currentAlerts.timestamp = Date.now();
					}

					const currentAlertCount = currentAlerts?.data?.length || 0;
					const currentAlertId = currentAlerts?.id || null;

					// Determine if we should trigger
					let shouldTrigger = false;
					let triggerReason = '';

					switch (triggerMode) {
						case 'newAlerts':
							if (currentAlerts && currentAlertId !== lastAlertId) {
								shouldTrigger = true;
								triggerReason = 'new_alert';
							} else if (triggerOnClear && !currentAlerts && lastAlertCount > 0) {
								shouldTrigger = true;
								triggerReason = 'all_clear';
							}
							break;

						case 'allAlerts':
							if (currentAlerts) {
								shouldTrigger = true;
								triggerReason = 'active_alerts';
							} else if (triggerOnClear && !isFirstCheck && lastAlertCount > 0) {
								shouldTrigger = true;
								triggerReason = 'all_clear';
							}
							break;

						case 'statusChange':
							if (currentAlertCount !== lastAlertCount || currentAlertId !== lastAlertId) {
								shouldTrigger = true;
								triggerReason = currentAlerts ? 'status_changed' : 'all_clear';
							}
							break;
					}

					// Apply filters
					if (shouldTrigger && currentAlerts) {
						let filteredAlerts = currentAlerts;

						// Filter by location
						if (filterByLocation && locationFilters.length > 0) {
							const filteredData = currentAlerts.data.filter(location => 
								locationFilters.some(filter => location.includes(filter))
							);
							
							if (filteredData.length === 0) {
								shouldTrigger = false;
							} else {
								filteredAlerts = { ...currentAlerts, data: filteredData };
							}
						}

						// Filter by area (this would require additional area mapping logic)
						if (filterByArea && areaFilter.length > 0) {
							// For now, we'll implement a basic area filter
							// In a full implementation, you'd need a mapping of locations to areas
							const filteredData = currentAlerts.data.filter(location => 
								areaFilter.some(area => {
									// Basic area matching - would need more sophisticated mapping
									if (area === 'עוטף עזה' && location.includes('עוטף')) return true;
									if (area === 'תל אביב' && location.includes('תל אביב')) return true;
									if (area === 'ירושלים' && location.includes('ירושלים')) return true;
									return false;
								})
							);

							if (filteredData.length === 0) {
								shouldTrigger = false;
							} else {
								filteredAlerts = { ...currentAlerts, data: filteredData };
							}
						}

						if (shouldTrigger) {
							currentAlerts = filteredAlerts;
						}
					}

					// Trigger if conditions are met
					if (shouldTrigger) {
						let outputData: any = {
							event_type: triggerReason,
							timestamp: new Date().toISOString(),
							alert_count: currentAlertCount,
							has_active_alerts: !!currentAlerts,
						};

						if (currentAlerts) {
							outputData = {
								...outputData,
								alert: {
									id: currentAlerts.id,
									category: currentAlerts.cat,
									title: currentAlerts.title,
									description: currentAlerts.desc,
									locations: currentAlerts.data,
									alert_timestamp: currentAlerts.timestamp,
								},
							};

							// Add enhanced location data if requested
							if (enhancedLocationData) {
								outputData.alert.locations_detailed = currentAlerts.data.map(location => ({
									name: location,
									hebrew_name: location,
									// Note: In a full implementation, you'd fetch actual location data
									// from a locations database or API
									estimated_shelter_time: 15, // Default fallback
									area: 'unknown', // Would be determined from location mapping
								}));
							}
						}

						// Include history if requested
						if (includeHistory) {
							try {
								const historyResponse = await axios.get(historyUrl, {
									timeout: 15000,
									headers: {
										'User-Agent': 'n8n-red-alert-trigger/1.0',
									},
								});

								if (historyResponse.data) {
									outputData.recent_history = Array.isArray(historyResponse.data) 
										? historyResponse.data.slice(0, 5)
										: [historyResponse.data];
								}
							} catch (historyError) {
								this.logger.warn(`Failed to fetch alert history: ${(historyError as Error).message}`);
								outputData.history_error = 'Failed to fetch recent history';
							}
						}

						// Emit the trigger event
						this.emit([
							this.helpers.returnJsonArray([outputData]),
						]);

						this.logger.info(`Red Alert Trigger: Triggered due to ${triggerReason}`, {
							alertId: currentAlertId,
							alertCount: currentAlertCount,
						});
					}

					// Update tracking variables
					lastAlertId = currentAlertId;
					lastAlertCount = currentAlertCount;
					isFirstCheck = false;

				} catch (error: any) {
					this.logger.error('Red Alert Trigger: Error checking for alerts', {
						error: error.message,
						stack: error.stack,
					});

					// Emit error event
					this.emit([
						this.helpers.returnJsonArray([{
							event_type: 'error',
							timestamp: new Date().toISOString(),
							error: error.message,
							error_type: 'api_error',
						}]),
					]);
				}
			};

			// Initial check
			await checkForAlerts();

			// Set up periodic checking
			intervalId = setInterval(checkForAlerts, checkInterval);
		};

		const closeFunction = async () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
			this.logger.info('Red Alert Trigger: Stopped monitoring');
		};

		const manualTriggerFunction = async () => {
			this.logger.info('Red Alert Trigger: Manual trigger executed');
			
			try {
				// Force a check for current alerts
				const response = await axios.get(alertsUrl, {
					timeout: 30000,
					headers: {
						'User-Agent': 'n8n-red-alert-trigger/1.0',
					},
				});

				let currentAlerts: IRedAlert | null = null;
				if (response.data && typeof response.data === 'object' && response.data.id) {
					currentAlerts = response.data as IRedAlert;
					currentAlerts.timestamp = Date.now();
				}

				const outputData = {
					event_type: 'manual_trigger',
					timestamp: new Date().toISOString(),
					alert_count: currentAlerts?.data?.length || 0,
					has_active_alerts: !!currentAlerts,
					alert: currentAlerts ? {
						id: currentAlerts.id,
						category: currentAlerts.cat,
						title: currentAlerts.title,
						description: currentAlerts.desc,
						locations: currentAlerts.data,
						alert_timestamp: currentAlerts.timestamp,
					} : null,
				};

				// For manual trigger we emit data instead of returning to match expected type
				this.emit([
					this.helpers.returnJsonArray([outputData]),
				]);
				return;
			} catch (error: any) {
				throw new NodeOperationError(this.getNode(), `Manual trigger failed: ${error.message}`);
			}
		};

		// Start monitoring immediately
		await startConsumer();

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
} 