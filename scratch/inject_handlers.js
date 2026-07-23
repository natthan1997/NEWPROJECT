const fs = require('fs');
const posSettingsPath = './components/pos/POSShopSettings.tsx';
let posContent = fs.readFileSync(posSettingsPath, 'utf8');

const daysArr = `
const DAYS = [
  { id: 'monday', label: 'วันจันทร์' },
  { id: 'tuesday', label: 'วันอังคาร' },
  { id: 'wednesday', label: 'วันพุธ' },
  { id: 'thursday', label: 'วันพฤหัสบดี' },
  { id: 'friday', label: 'วันศุกร์' },
  { id: 'saturday', label: 'วันเสาร์' },
  { id: 'sunday', label: 'วันอาทิตย์' }
];

`;

const handlersStr = `
    const updateOpeningHour = (day: string, field: string, value: any) => {
        if (!settings) return;
        const newHours = { ...(settings.opening_hours as any) };
        newHours[day] = { ...newHours[day], [field]: value };
        setSettings({ ...settings, opening_hours: newHours });
    }

    const addDeliveryRule = () => {
        if (!settings) return;
        const rules = [...(settings.delivery_fee_rules as any[] || [])];
        rules.push({ max_dist: 5, fee: 40 });
        setSettings({ ...settings, delivery_fee_rules: rules });
    }

    const removeDeliveryRule = (index: number) => {
        if (!settings) return;
        const rules = [...(settings.delivery_fee_rules as any[] || [])];
        rules.splice(index, 1);
        setSettings({ ...settings, delivery_fee_rules: rules });
    }

    const updateDeliveryRule = (index: number, field: string, value: number) => {
        if (!settings) return;
        const rules = [...(settings.delivery_fee_rules as any[] || [])];
        rules[index] = { ...rules[index], [field]: value };
        setSettings({ ...settings, delivery_fee_rules: rules });
    }

`;

posContent = posContent.replace(/interface POSShopSettingsProps \{/, daysArr + 'interface POSShopSettingsProps {');
posContent = posContent.replace(/const handleSave = async \(\) => \{/, handlersStr + 'const handleSave = async () => {');

fs.writeFileSync(posSettingsPath, posContent);
console.log('injected');
