import React, { useRef, useState, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

interface SCInputProps {
  id?: string;
  name?: string;
  label?: string;
  className?: string;
  inputClass?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'phone';
  value?: string | number;
  placeholder?: string;
  helpText?: string;
  hint?: string;
  readOnly?: boolean;
  hasError?: boolean;
  handleFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

const SCInput: React.FC<SCInputProps> = ({
  type = 'text',
  value = '',
  helpText = '',
  readOnly = false,
  hasError = false,
  handleChange = () => {},
  handleFocus = () => {},
  handleBlur = () => {},
  handleKeyPress = () => {},
  id,
  name,
  label,
  className,
  inputClass,
  placeholder,
  hint,
}) => {
  const inputEl = useRef<HTMLInputElement>(null);
  const [model, setModel] = useState(value);

  useEffect(() => {
    if (value !== model) {
      setModel(value);
    }
  }, [value]);

  const onLegendClick = () => {
    if (inputEl.current && !readOnly) {
      inputEl.current.focus();
    }
  };

  const onValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setModel(e.target.value);
    handleChange(e);
  };

  const onInputScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    return false;
  };

  const containerClass = ['sc-input-container'];
  if (className) containerClass.push(className);
  if (hasError) containerClass.push('sc-input-error');

  const inputLabel = !id ? (
    <legend onClick={onLegendClick}>{label}</legend>
  ) : (
    <label htmlFor={id}>{label}</label>
  );

  const renderHelpText = helpText ? (
    <div className="sc-tooltip" id="help-text-tooltip" title={helpText}>
      <i className="sc-question text-grey-darker ml-2" />
    </div>
  ) : null;

  return (
    <div className={containerClass.join(' ')}>
      <div className="flex">
        {inputLabel}
        {renderHelpText}
      </div>
      <input
        ref={inputEl}
        id={id}
        name={name}
        className={inputClass}
        type={type}
        placeholder={placeholder}
        readOnly={readOnly}
        value={model}
        onChange={onValueChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onWheel={onInputScroll}
        onKeyPress={handleKeyPress}
      />
      <span className="sc-input-hint">{hint}</span>
    </div>
  );
};

export default SCInput; 