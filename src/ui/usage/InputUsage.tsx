import React, { useState } from 'react';
import Input, { DateRangeValue, SelectOption } from '../components/Input';

const InputUsage: React.FC = () => {
  // State for various input examples
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [numberValue, setNumberValue] = useState(0);
  const [rangeValue, setRangeValue] = useState(50);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>({ start: null, end: null });
  const [colorValue, setColorValue] = useState('#3b82f6');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [selectValue, setSelectValue] = useState<string | number>('');
  const [textareaValue, setTextareaValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [telValue, setTelValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // Select options
  const selectOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
    { value: 'option4', label: 'Option 4' },
  ];

  // Helper to handle date range changes
  const handleDateRangeChange = (value: DateRangeValue) => {
    setDateRangeValue(value);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold mb-6">Input Component Usage Examples</h1>

      {/* Basic Text Inputs */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Basic Text Inputs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Text Input"
            placeholder="Enter text..."
            value={textValue}
            onChange={setTextValue}
          />
          
          <Input
            label="Email Input"
            type="email"
            placeholder="user@example.com"
            value={emailValue}
            onChange={setEmailValue}
            hint="We'll never share your email"
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={passwordValue}
            onChange={setPasswordValue}
          />
          
          <Input
            label="Number Input"
            type="number"
            value={numberValue}
            onChange={setNumberValue}
            min={0}
            max={100}
            step={1}
            hint="Enter a number between 0 and 100"
          />
        </div>
      </section>

      {/* Sizes */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Sizes</h2>
        
        <div className="space-y-4">
          <Input
            label="Small (sm)"
            size="sm"
            placeholder="Small input"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Medium (md) - Default"
            size="md"
            placeholder="Medium input"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Large (lg)"
            size="lg"
            placeholder="Large input"
            value=""
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Variants */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Variants</h2>
        
        <div className="space-y-4">
          <Input
            label="Default Variant"
            variant="default"
            placeholder="Default style"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Filled Variant"
            variant="filled"
            placeholder="Filled background"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Outline Variant"
            variant="outline"
            placeholder="Outline style"
            value=""
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Radius Options */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Border Radius</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="None"
            radius="none"
            placeholder="No border radius"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Small (sm)"
            radius="sm"
            placeholder="Small radius"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Medium (md)"
            radius="md"
            placeholder="Medium radius"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Large (lg)"
            radius="lg"
            placeholder="Large radius"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Extra Large (xl)"
            radius="xl"
            placeholder="XL radius"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Full"
            radius="full"
            placeholder="Full radius (pill)"
            value=""
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Label Types */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Label Types</h2>
        
        <div className="space-y-6">
          <Input
            label="Default Label"
            labelType="default"
            placeholder="Label appears above"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Floating Label"
            labelType="floating"
            placeholder="Label floats on focus"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Required Field"
            required
            placeholder="Required input"
            value=""
            onChange={() => {}}
            hint="This field is required"
          />
        </div>
      </section>

      {/* Icons */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Icons</h2>
        
        <div className="space-y-4">
          <Input
            label="Prefix Icon"
            prefixIcon="user"
            placeholder="User name"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Suffix Icon"
            suffixIcon="search"
            placeholder="Search..."
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Clickable Suffix Icon"
            suffixIcon="refresh"
            suffixIconClickable
            placeholder="Click the refresh icon"
            value=""
            onChange={() => {}}
            onSuffixIconClick={() => alert('Refresh clicked!')}
          />
          
          <Input
            label="Both Icons"
            prefixIcon="mail"
            suffixIcon="check"
            placeholder="Email with both icons"
            value=""
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Error and Hint States */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Error and Hint States</h2>
        
        <div className="space-y-4">
          <Input
            label="With Hint"
            hint="This is helpful hint text"
            placeholder="Hint example"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="With Error"
            error="This field is required"
            placeholder="Error example"
            value=""
            onChange={() => {}}
          />
          
          <Input
            label="Error with Hint"
            hint="Please enter a valid email"
            error="Invalid email format"
            type="email"
            placeholder="user@example.com"
            value="invalid"
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Disabled and Readonly States */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Disabled & Readonly</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Disabled Input"
            disabled
            placeholder="Cannot interact"
            value="Disabled text"
            onChange={() => {}}
          />
          
          <Input
            label="Readonly Input"
            readonly
            placeholder="Cannot modify"
            value="Readonly content"
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Special Input Types */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Special Input Types</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Search"
            type="search"
            placeholder="Search..."
            value={searchValue}
            onChange={setSearchValue}
            prefixIcon="search"
          />
          
          <Input
            label="Telephone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={telValue}
            onChange={setTelValue}
          />
          
          <Input
            label="URL"
            type="url"
            placeholder="https://example.com"
            value={urlValue}
            onChange={setUrlValue}
          />
          
          <Input
            label="Time"
            type="time"
            value={timeValue}
            onChange={setTimeValue}
          />
        </div>
      </section>

      {/* Range Slider */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Range Slider</h2>
        
        <Input
          label="Volume"
          type="range"
          value={rangeValue}
          onChange={setRangeValue}
          min={0}
          max={100}
          step={1}
          hint={`Current value: ${rangeValue}`}
        />
      </section>

      {/* Checkbox */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Checkbox</h2>
        
        <Input
          label="I agree to the terms and conditions"
          type="checkbox"
          value={checkboxValue}
          onChange={setCheckboxValue}
        />
      </section>

      {/* Select Dropdown */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Select Dropdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Default Label"
            labelType="default"
            type="select"
            selectOptions={selectOptions}
            selectPlaceholder="Choose an option"
            value={selectValue}
            onChange={setSelectValue}
          />
          
          <Input
            label="Floating Label Select"
            labelType="floating"
            type="select"
            selectOptions={selectOptions}
            selectPlaceholder="Select something"
            value={selectValue}
            onChange={setSelectValue}
          />
        </div>
      </section>

      {/* Textarea */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Textarea</h2>
        
        <Input
          label="Description"
          type="textarea"
          placeholder="Enter a detailed description..."
          rows={4}
          value={textareaValue}
          onChange={setTextareaValue}
          hint="You can write multiple lines here"
        />
      </section>

      {/* Date Picker */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Date Picker</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Single Date"
            type="date"
            value={dateValue}
            onChange={(val) => setDateValue(val as Date)}
            placeholder="Select a date"
          />
          
          <Input
            label="Date Range - Auto Apply"
            type="date-range"
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            autoApply={true}
            showQuickSelect={true}
          />
          
          <Input
            label="Date Range - Manual Apply"
            type="date-range"
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            autoApply={false}
            showQuickSelect={true}
          />
          
          <Input
            label="Date Range - No Quick Select"
            type="date-range"
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            autoApply={true}
            showQuickSelect={false}
          />
        </div>
      </section>

      {/* Color Picker */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Color Picker</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Default Label Color Picker"
            labelType="default"
            type="color"
            value={colorValue}
            onChange={setColorValue}
          />
          
          <Input
            label="Floating Label Color Picker"
            labelType="floating"
            type="color"
            value={colorValue}
            onChange={setColorValue}
          />
        </div>
      </section>

      {/* Combined Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Combined Features</h2>
        
        <div className="space-y-4">
          <Input
            label="Form Input"
            labelType="floating"
            variant="outline"
            radius="lg"
            size="lg"
            prefixIcon="user"
            suffixIcon="check"
            suffixIconClickable
            placeholder="Your full name"
            value={textValue}
            onChange={setTextValue}
            hint="Enter your legal name"
            required
          />
          
          <Input
            label="Search with Error"
            type="search"
            variant="filled"
            radius="full"
            prefixIcon="search"
            error="No results found"
            placeholder="Search..."
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>
      </section>
    </div>
  );
};

export default InputUsage;