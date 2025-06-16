import { RedAlertTrigger } from '../nodes/RedAlertTrigger/RedAlertTrigger.node';

describe('RedAlertTrigger', () => {
  let node: RedAlertTrigger;

  beforeEach(() => {
    node = new RedAlertTrigger();
  });

  test('should have correct node description', () => {
    expect(node.description.displayName).toBe('Red Alert Trigger');
    expect(node.description.name).toBe('redAlertTrigger');
    expect(node.description.group).toContain('trigger');
  });

  test('should have required properties', () => {
    const properties = node.description.properties;
    expect(properties).toBeDefined();
    expect(properties.length).toBeGreaterThan(0);
    
    const triggerModeProperty = properties.find(p => p.name === 'triggerMode');
    expect(triggerModeProperty).toBeDefined();
    expect((triggerModeProperty as any)?.type).toBe('options');
  });

  test('should have correct trigger modes', () => {
    const triggerModeProperty = node.description.properties.find(p => p.name === 'triggerMode');
    const options = (triggerModeProperty as any)?.options as any[];
    
    expect(options).toHaveLength(3);
    expect(options[0].value).toBe('newAlerts');
    expect(options[1].value).toBe('allAlerts');
    expect(options[2].value).toBe('statusChange');
  });
}); 