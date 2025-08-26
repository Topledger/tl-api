# Usage Examples Tab Implementation

## Overview
Converted the stacked usage examples into a clean tabbed interface for better space utilization and user experience.

## Changes Made

### Before (Stacked Layout)
```
Usage Examples
┌─────────────────────────────────────┐
│ cURL                                │
│ [curl command code block]           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ JavaScript (fetch)                  │
│ [javascript code block]             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Python (requests)                   │
│ [python code block]                 │
└─────────────────────────────────────┘
```

### After (Tabbed Interface)
```
Usage Examples
┌─────────────────────────────────────┐
│ [cURL] [JavaScript] [Python]       │
├─────────────────────────────────────┤
│                                     │
│ [Selected tab content]              │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Details

### New Component: `UsageExamplesTabs`
- **Self-contained component** within the ApiDetailsModal file
- **State management**: Uses `useState` to track active tab
- **Three tabs**: cURL, JavaScript, Python
- **Dynamic content**: Updates based on the actual API endpoint

### Tab Features
1. **Active State Indicators**:
   - Blue text color for active tab
   - White background for active tab
   - Blue bottom border (0.5px height)
   - Smooth transitions

2. **Interactive Design**:
   - Hover effects on inactive tabs
   - Equal width tabs (`flex-1`)
   - Responsive to clicks

3. **Content Display**:
   - Only active tab content visible
   - Proper code formatting with `font-mono`
   - Scrollable overflow for long code

### Visual Improvements
- **Rounded borders** for modern look
- **Gray background** for code areas
- **Shadow effects** on active tabs
- **Smooth transitions** (200ms duration)
- **Consistent spacing** and padding

## Code Structure
```typescript
const UsageExamplesTabs = ({ curlExample, fetchExample, fullEndpointUrl }) => {
  const [activeTab, setActiveTab] = useState('curl');
  
  const tabs = [
    { id: 'curl', label: 'cURL', content: curlExample },
    { id: 'js', label: 'JavaScript', content: fetchExample },
    { id: 'python', label: 'Python', content: pythonExample }
  ];
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab headers with active state styling */}
      {/* Tab content with conditional visibility */}
    </div>
  );
};
```

## Benefits
1. **Space Efficiency**: Reduces vertical space usage
2. **Better UX**: Easy switching between examples
3. **Clean Design**: Modern tabbed interface
4. **Responsive**: Works well in side-by-side layout
5. **Accessible**: Keyboard and mouse navigation

## Tab Content
- **cURL**: Direct command line usage
- **JavaScript**: Fetch API implementation
- **Python**: Requests library example

All examples use the actual API endpoint with the user's selected API key for immediate copy-paste usage.
