import React from 'react';
import { emeraldTheme } from './emerald-theme';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Emerald Themed Card Component
 * Pre-styled with the emerald theme
 */
export const EmeraldCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerClassName?: string;
  onClick?: () => void;
}> = ({ children, className = '', title, headerClassName = '', onClick }) => {
  const { card, cardHeader, cardTitle } = emeraldTheme;
  
  return (
    <Card 
      className={`${card.base} ${className}`}
      style={{ 
        boxShadow: card.styles?.boxShadow as string || '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)'
      }}
      onClick={onClick}
    >
      {title && (
        <CardHeader className={`${cardHeader.base} ${headerClassName}`}>
          <CardTitle 
            className={cardTitle.base}
            style={{ 
              textShadow: cardTitle.styles?.textShadow as string || '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Emerald Themed Input Component
 * Pre-styled with the emerald theme
 */
export const EmeraldInput: React.FC<{
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}> = ({ 
  id, 
  label, 
  type = 'text', 
  placeholder = '', 
  defaultValue = '', 
  value,
  disabled = false,
  onChange,
  className = '',
  required = false
}) => {
  const { input, label: labelTheme } = emeraldTheme;
  
  return (
    <div>
      {label && <Label htmlFor={id} className={labelTheme.base}>{label}</Label>}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        disabled={disabled}
        onChange={onChange}
        required={required}
        className={`${input.base} ${className}`}
        style={{ 
          boxShadow: input.styles?.boxShadow as string || 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  );
};

/**
 * Emerald Themed Button Component
 * Pre-styled with the emerald theme
 */
export const EmeraldButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'yellow';
  icon?: React.ReactNode;
}> = ({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
  variant = 'primary',
  icon
}) => {
  const buttonTheme = emeraldTheme.button[variant];
  
  return (
    <Button 
      type={type}
      className={`${buttonTheme.base} ${className}`}
      style={{ 
        boxShadow: buttonTheme.styles?.boxShadow as string || '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.15)',
        textShadow: variant === 'primary' ? 
          (buttonTheme.styles as any)?.textShadow as string || '0 1px 2px rgba(0, 0, 0, 0.3)' :
          '0 1px 2px rgba(0, 0, 0, 0.3)'
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={buttonTheme.shimmer}></span>
      <span className="relative z-10 flex items-center">
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
      </span>
    </Button>
  );
};

/**
 * Emerald Themed Select Component
 * Pre-styled with the emerald theme
 */
export const EmeraldSelect: React.FC<{
  id: string;
  label?: string;
  options: { value: string, label: string }[];
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  required?: boolean;
}> = ({ 
  id, 
  label, 
  options, 
  defaultValue = '', 
  value,
  onChange,
  className = '',
  required = false
}) => {
  const { select, label: labelTheme } = emeraldTheme;
  
  return (
    <div>
      {label && <Label htmlFor={id} className={labelTheme.base}>{label}</Label>}
      <select
        id={id}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        required={required}
        className={`${select.base} ${className}`}
        style={{ 
          boxShadow: select.styles?.boxShadow as string || 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Emerald Themed Panel Component
 * Pre-styled with the emerald theme
 */
export const EmeraldPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  const { panel } = emeraldTheme;
  
  return (
    <div 
      className={`${panel.base} ${className}`}
      style={{ 
        boxShadow: panel.styles?.boxShadow as string || '0 4px 12px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * Emerald Themed Feature Highlight Component
 * For important features or notices
 */
export const EmeraldFeatureHighlight: React.FC<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, icon, className = '', onClick }) => {
  const { featureHighlight } = emeraldTheme;
  
  return (
    <div 
      className={`${featureHighlight.base} ${className}`}
      style={{ 
        boxShadow: featureHighlight.styles?.boxShadow as string || '0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <div className="flex items-start">
        {icon && (
          <div className={featureHighlight.iconContainer}>
            {icon}
          </div>
        )}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Emerald Themed Tabs Component
 * Pre-styled with the emerald theme
 */
export const EmeraldTabs: React.FC<{
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  tabs: { value: string, label: string, icon?: React.ReactNode }[];
  children: React.ReactNode;
  className?: string;
}> = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  tabs, 
  children, 
  className = ''
}) => {
  const { tabs: tabsTheme } = emeraldTheme;
  
  return (
    <Tabs 
      defaultValue={defaultValue} 
      value={value} 
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList 
        className={tabsTheme.list}
        style={{ 
          boxShadow: tabsTheme.listStyles?.boxShadow as string || '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.15)'
        }}
      >
        {tabs.map(tab => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value}
            className={tabsTheme.trigger}
            style={{ 
              textShadow: tabsTheme.triggerStyles?.textShadow as string || '0 1px 2px rgba(0, 0, 0, 0.4)'
            }}
          >
            {tab.icon && <span className="h-4 w-4 mr-2">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
};