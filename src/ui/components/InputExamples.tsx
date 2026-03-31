import React, { useState } from 'react';
import Input, { DateRangeValue } from './Input';

// Import Remix Icon CSS (required for icons)
// Add to your HTML: <link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet"/>

const InputUsageExamples = () => {
  // State management for different input types
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [numberValue, setNumberValue] = useState(0);
  const [rangeValue, setRangeValue] = useState(50);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [selectValue, setSelectValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>({ start: null, end: null });
  const [colorValue, setColorValue] = useState('#0d5a09');

  // Options for select dropdown
  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'in', label: 'India' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold mb-6">Input Component - Complete Usage Guide</h1>

      {/* ==================== BASIC INPUT TYPES ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">1. Basic Input Types</h2>
        
        {/* Text Input */}
        <Input
          type="text"
          label="Text Input"
          placeholder="Enter your name"
          value={textValue}
          onChange={setTextValue}
          hint="This is a helpful hint"
        />

        {/* Email Input */}
        <Input
          type="email"
          label="Email Address"
          placeholder="user@example.com"
          value={emailValue}
          onChange={setEmailValue}
          required
          error={emailValue && !emailValue.includes('@') ? 'Please enter a valid email' : ''}
        />

        {/* Password Input */}
        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={passwordValue}
          onChange={setPasswordValue}
          hint="At least 8 characters"
          suffixIcon="lock"
        />

        {/* Number Input */}
        <Input
          type="number"
          label="Age"
          placeholder="Enter your age"
          value={numberValue}
          onChange={setNumberValue}
          min={0}
          max={120}
          step={1}
          suffixIcon="user"
        />

        {/* Range Slider */}
        <Input
          type="range"
          label="Volume"
          value={rangeValue}
          onChange={setRangeValue}
          min={0}
          max={100}
          step={1}
          hint={`Current value: ${rangeValue}%`}
        />

        {/* Checkbox */}
        <Input
          type="checkbox"
          label="I agree to the terms and conditions"
          value={checkboxValue}
          onChange={setCheckboxValue}
          required
        />

        {/* Textarea */}
        <Input
          type="textarea"
          label="Comments"
          placeholder="Enter your comments here..."
          value={textareaValue}
          onChange={setTextareaValue}
          rows={4}
          hint="Maximum 500 characters"
        />

        {/* Select Dropdown */}
        <Input
          type="select"
          label="Country"
          value={selectValue}
          onChange={setSelectValue}
          selectOptions={countryOptions}
          selectPlaceholder="Select a country"
          prefixIcon="global"
          required
        />
      </section>

      {/* ==================== DATE & DATE RANGE ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">2. Date & Date Range Pickers</h2>

        {/* Single Date Picker - Auto Apply */}
        <Input
          type="date"
          label="Birth Date (Auto Apply)"
          placeholder="Select your birth date"
          value={dateValue}
          onChange={setDateValue}
          hint="Click to open calendar"
          prefixIcon="calendar"
        />

        {/* Single Date Picker - Manual Apply */}
        <Input
          type="date"
          label="Appointment Date (Manual Apply)"
          placeholder="Select appointment date"
          value={dateValue}
          onChange={setDateValue}
          autoApply={false}
          hint="Select date and click apply"
        />

        {/* Date Range - Auto Apply */}
        <Input
          type="date-range"
          label="Booking Period (Auto Apply)"
          placeholder="Select date range"
          value={dateRangeValue}
          onChange={setDateRangeValue}
          autoApply={true}
          showQuickSelect={true}
          hint="Select start and end dates"
          prefixIcon="calendar"
        />

        {/* Date Range - Manual Apply with Apply/Cancel */}
        <Input
          type="date-range"
          label="Project Timeline (Manual Apply)"
          placeholder="Select project timeline"
          value={dateRangeValue}
          onChange={setDateRangeValue}
          autoApply={false}
          showQuickSelect={true}
          hint="Select range and click apply"
        />

        {/* Date Range - Without Quick Select */}
        <Input
          type="date-range"
          label="Simple Date Range"
          placeholder="Select range"
          value={dateRangeValue}
          onChange={setDateRangeValue}
          showQuickSelect={false}
          autoApply={true}
        />
      </section>

      {/* ==================== COLOR PICKER ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">3. Color Picker</h2>

        <Input
          type="color"
          label="Theme Color"
          placeholder="Select a color"
          value={colorValue}
          onChange={setColorValue}
          hint="Choose any color from the palette"
          suffixIcon="palette"
        />
      </section>

      {/* ==================== INPUT VARIANTS & STYLES ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">4. Input Variants & Styles</h2>

        {/* Different Variants */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="text"
            label="Default Variant"
            placeholder="Default style"
            value={textValue}
            onChange={setTextValue}
            variant="default"
          />
          
          <Input
            type="text"
            label="Filled Variant"
            placeholder="Filled style"
            value={textValue}
            onChange={setTextValue}
            variant="filled"
          />
          
          <Input
            type="text"
            label="Outline Variant"
            placeholder="Outline style"
            value={textValue}
            onChange={setTextValue}
            variant="outline"
          />
        </div>

        {/* Different Sizes */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="text"
            label="Small Size"
            placeholder="Small input"
            value={textValue}
            onChange={setTextValue}
            size="sm"
          />
          
          <Input
            type="text"
            label="Medium Size (Default)"
            placeholder="Medium input"
            value={textValue}
            onChange={setTextValue}
            size="md"
          />
          
          <Input
            type="text"
            label="Large Size"
            placeholder="Large input"
            value={textValue}
            onChange={setTextValue}
            size="lg"
          />
        </div>

        {/* Different Border Radius */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="text"
            label="Sharp Corners"
            placeholder="No border radius"
            value={textValue}
            onChange={setTextValue}
            radius="none"
          />
          
          <Input
            type="text"
            label="Rounded"
            placeholder="Medium radius"
            value={textValue}
            onChange={setTextValue}
            radius="md"
          />
          
          <Input
            type="text"
            label="Pill Shape"
            placeholder="Fully rounded"
            value={textValue}
            onChange={setTextValue}
            radius="full"
          />
        </div>
      </section>

      {/* ==================== LABEL TYPES ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">5. Label Types</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            label="Floating Label"
            placeholder="Label floats above"
            value={textValue}
            onChange={setTextValue}
            labelType="floating"
            hint="Default style - label floats on focus"
          />
          
          <Input
            type="text"
            label="Default Label"
            placeholder="Label stays above"
            value={textValue}
            onChange={setTextValue}
            labelType="default"
            hint="Traditional label position"
          />
        </div>
      </section>

      {/* ==================== ICONS ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">6. Icons (Remix Icon)</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            label="Search"
            placeholder="Search..."
            value={textValue}
            onChange={setTextValue}
            prefixIcon="search"
            suffixIcon="mic"
            suffixIconClickable
            onSuffixIconClick={() => console.log('Voice search clicked')}
          />
          
          <Input
            type="text"
            label="User Profile"
            placeholder="Username"
            value={textValue}
            onChange={setTextValue}
            prefixIcon="user"
            suffixIcon="edit"
            suffixIconClickable
            onSuffixIconClick={() => console.log('Edit profile')}
          />
        </div>
      </section>

      {/* ==================== STATES ==================== */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">7. Input States</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            label="Error State"
            placeholder="Invalid input"
            value="Invalid value"
            onChange={setTextValue}
            error="This field has an error"
          />
          
          <Input
            type="text"
            label="Disabled State"
            placeholder="Cannot edit"
            value="Disabled value"
            onChange={setTextValue}
            disabled
          />
          
          <Input
            type="text"
            label="Readonly State"
            placeholder="Read only"
            value="Readonly value"
            onChange={setTextValue}
            readonly
          />
          
          <Input
            type="text"
            label="Required Field"
            placeholder="Required input"
            value={textValue}
            onChange={setTextValue}
            required
            hint="This field is required"
          />
        </div>
      </section>

      {/* ==================== COMPLEX EXAMPLES ==================== */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">8. Complex Examples</h2>

        {/* Booking Form Example */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Hotel Booking Form</h3>
          <div className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              value={textValue}
              onChange={setTextValue}
              prefixIcon="user"
              required
            />
            
            <Input
              type="email"
              label="Email"
              placeholder="email@example.com"
              value={emailValue}
              onChange={setEmailValue}
              prefixIcon="mail"
              required
            />
            
            <Input
              type="date-range"
              label="Stay Duration"
              placeholder="Select check-in and check-out"
              value={dateRangeValue}
              onChange={setDateRangeValue}
              autoApply={false}
              showQuickSelect={true}
              prefixIcon="calendar"
              required
            />
            
            <Input
              type="select"
              label="Room Type"
              value={selectValue}
              onChange={setSelectValue}
              selectOptions={[
                { value: 'standard', label: 'Standard Room' },
                { value: 'deluxe', label: 'Deluxe Room' },
                { value: 'suite', label: 'Executive Suite' },
              ]}
              selectPlaceholder="Select room type"
              prefixIcon="hotel"
              required
            />
            
            <Input
              type="number"
              label="Number of Guests"
              value={numberValue}
              onChange={setNumberValue}
              min={1}
              max={10}
              step={1}
              prefixIcon="group"
            />
            
            <Input
              type="checkbox"
              label="I agree to the terms and conditions"
              value={checkboxValue}
              onChange={setCheckboxValue}
              required
            />
          </div>
        </div>

        {/* Settings Form Example */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Appearance Settings</h3>
          <div className="space-y-4">
            <Input
              type="color"
              label="Primary Color"
              value={colorValue}
              onChange={setColorValue}
              prefixIcon="palette"
            />
            
            <Input
              type="range"
              label="Brightness"
              value={rangeValue}
              onChange={setRangeValue}
              min={0}
              max={100}
              suffixIcon="sun"
            />
            
            <Input
              type="select"
              label="Theme Mode"
              value={selectValue}
              onChange={setSelectValue}
              selectOptions={[
                { value: 'light', label: 'Light Mode' },
                { value: 'dark', label: 'Dark Mode' },
                { value: 'system', label: 'System Default' },
              ]}
              prefixIcon="contrast"
            />
          </div>
        </div>
      </section>

      {/* ==================== CURRENT STATE DISPLAY ==================== */}
      <section className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Current Form State</h2>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
          {JSON.stringify({
            textValue,
            emailValue,
            passwordValue: '••••••••',
            numberValue,
            rangeValue,
            checkboxValue,
            selectValue,
            textareaValue,
            dateValue,
            dateRangeValue,
            colorValue,
          }, null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default InputUsageExamples;