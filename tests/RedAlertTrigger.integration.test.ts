import { RedAlertTrigger } from '../nodes/RedAlertTrigger/RedAlertTrigger.node';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RedAlertTrigger manual trigger', () => {
  const baseParams = {
    triggerMode: 'newAlerts',
    checkInterval: 5,
    filterByLocation: false,
    locationFilter: '',
    filterByArea: false,
    areaFilter: [],
    includeHistory: false,
    triggerOnClear: true,
    enhancedLocationData: false,
  };

  const buildMockThis = () => {
    return {
      // getNodeParameter returns based on mapping above
      getNodeParameter: (name: string) => (baseParams as any)[name],
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      helpers: {
        returnJsonArray: (arr: any[]) => arr,
      },
      emit: jest.fn(),
      getNode: () => ({}),
    } as any;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('manual trigger emits inactive alert payload when no alerts', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} as any });

    const mockThis = buildMockThis();
    const node = new RedAlertTrigger();

    const response = await node.trigger.call(mockThis as any);
    await response.manualTriggerFunction!();
    await response.closeFunction?.();

    expect(mockThis.emit).toHaveBeenCalledTimes(1);
    const emitted = mockThis.emit.mock.calls[0][0];
    expect(emitted[0][0].has_active_alerts).toBe(false);
    expect(emitted[0][0].alert_count).toBe(0);
  });

  test('manual trigger emits active alert payload with locations', async () => {
    const alertData = {
      id: '123',
      cat: '1',
      title: 'Rocket Fire',
      data: ['תל אביב', 'חיפה'],
      desc: 'Take shelter',
    };
    mockedAxios.get.mockResolvedValue({ data: alertData as any });

    const mockThis = buildMockThis();
    const node = new RedAlertTrigger();

    const response = await node.trigger.call(mockThis as any);
    await response.manualTriggerFunction!();
    await response.closeFunction?.();

    expect(mockThis.emit.mock.calls.length).toBeGreaterThanOrEqual(2);
    const emitted = mockThis.emit.mock.calls[mockThis.emit.mock.calls.length - 1][0];
    const payload = emitted[0][0];

    expect(payload.has_active_alerts).toBe(true);
    expect(payload.alert_count).toBe(alertData.data.length);
    expect(payload.alert.id).toBe(alertData.id);
    expect(payload.alert.locations).toEqual(alertData.data);
  });
}); 