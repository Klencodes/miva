import React, { useState } from 'react';
import Button, { ButtonVariant } from '../components/Button';

const ButtonUsage: React.FC = () => {
  const [loadingState, setLoadingState] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(5);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleAsyncClick = () => {
    setLoadingState(true);
    setTimeout(() => {
      setLoadingState(false);
      setClickCount(prev => prev + 1);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold mb-6">Button Component - Remix Icons Edition</h1>

      {/* ============================================ */}
      {/* 1. BASIC VARIANTS */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="success">Success</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="info">Info</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="link">Link</Button>
          <Button variant="transparent">Transparent</Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. BUTTON SIZES */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-text-light">Small (sm)</span>
            <Button size="sm" variant="primary">Small</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-text-light">Medium (md) - Default</span>
            <Button size="md" variant="primary">Medium</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-text-light">Large (lg)</span>
            <Button size="lg" variant="primary">Large</Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. RADIUS OPTIONS */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Border Radius Options</h2>
        <div className="flex flex-wrap gap-4">
          <Button radius="none" variant="primary">None</Button>
          <Button radius="sm" variant="primary">Small</Button>
          <Button radius="md" variant="primary">Medium</Button>
          <Button radius="lg" variant="primary">Large</Button>
          <Button radius="xl" variant="primary">XL</Button>
          <Button radius="full" variant="primary">Full</Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 4. PILL BUTTONS (FULL ROUNDED) */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Pill Buttons (Fully Rounded)</h2>
        <div className="flex flex-wrap gap-4">
          <Button pill variant="primary">Pill Button</Button>
          <Button pill variant="success">Success Pill</Button>
          <Button pill variant="danger">Danger Pill</Button>
          <Button pill variant="outline">Outline Pill</Button>
          <Button pill variant="ghost">Ghost Pill</Button>
        </div>
        <p className="text-sm text-text-light mt-2">
          Pill buttons have fully rounded corners (border-radius: 9999px)
        </p>
      </section>

      {/* ============================================ */}
      {/* 5. ICON ONLY BUTTONS */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Icon Only Buttons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button iconOnly icon="search-line" variant="primary" title="Search" />
            <Button iconOnly icon="settings-4-line" variant="secondary" title="Settings" />
            <Button iconOnly icon="notification-3-line" variant="ghost" title="Notifications" />
            <Button iconOnly icon="user-line" variant="outline" title="User Profile" />
            <Button iconOnly icon="heart-line" variant="danger" title="Like" />
            <Button iconOnly icon="star-line" variant="success" title="Star" />
            <Button iconOnly icon="edit-line" variant="info" title="Edit" />
            <Button iconOnly icon="delete-bin-line" variant="danger" title="Delete" />
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Different Sizes for Icon Only</h3>
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-text-light">Small</span>
                <Button iconOnly size="sm" icon="user-line" variant="primary" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-text-light">Medium</span>
                <Button iconOnly size="md" icon="user-line" variant="primary" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-text-light">Large</span>
                <Button iconOnly size="lg" icon="user-line" variant="primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. BUTTONS WITH ICONS AND TEXT */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Buttons with Icons + Text</h2>
        <div className="flex flex-wrap gap-4">
          <Button icon="add-line" variant="primary">Add New</Button>
          <Button icon="edit-line" variant="secondary">Edit Item</Button>
          <Button icon="delete-bin-line" variant="danger">Delete</Button>
          <Button icon="search-line" variant="outline">Search</Button>
          <Button icon="download-line" variant="success">Download</Button>
          <Button icon="upload-line" variant="info">Upload</Button>
          <Button icon="refresh-line" variant="ghost">Refresh</Button>
          <Button icon="arrow-right-line" variant="link">Next</Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 7. BADGE BUTTONS */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Badge Buttons</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Basic Badges</h3>
            <div className="flex flex-wrap gap-8">
              <Button 
                icon="notification-3-line" 
                variant="ghost"
                badge={{ count: 3 }}
              >
                Notifications
              </Button>
              
              <Button 
                icon="mail-line" 
                variant="outline"
                badge={{ count: 15, max: 9 }}
              >
                Messages
              </Button>
              
              <Button 
                iconOnly 
                icon="notification-3-line" 
                variant="ghost"
                badge={{ count: 7 }}
                title="Notifications"
              />
              
              <Button 
                iconOnly 
                icon="user-add-line" 
                variant="primary"
                badge={{ count: 1, variant: 'success' }}
                title="Friend Request"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Badge Variants</h3>
            <div className="flex flex-wrap gap-6">
              <Button 
                variant="outline"
                badge={{ count: 5, variant: 'danger' }}
                icon="alert-line"
              >
                Danger Badge
              </Button>
              <Button 
                variant="outline"
                badge={{ count: 5, variant: 'primary' }}
                icon="information-line"
              >
                Primary Badge
              </Button>
              <Button 
                variant="outline"
                badge={{ count: 5, variant: 'success' }}
                icon="check-line"
              >
                Success Badge
              </Button>
              <Button 
                variant="outline"
                badge={{ count: 5, variant: 'warning' }}
                icon="error-warning-line"
              >
                Warning Badge
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Badge Positions</h3>
            <div className="flex flex-wrap gap-8">
              <Button 
                iconOnly 
                icon="notification-3-line" 
                variant="ghost"
                badge={{ count: 3, position: 'top-right' }}
                title="Top Right"
              />
              <Button 
                iconOnly 
                icon="notification-3-line" 
                variant="ghost"
                badge={{ count: 3, position: 'top-left' }}
                title="Top Left"
              />
              <Button 
                iconOnly 
                icon="notification-3-line" 
                variant="ghost"
                badge={{ count: 3, position: 'bottom-right' }}
                title="Bottom Right"
              />
              <Button 
                iconOnly 
                icon="notification-3-line" 
                variant="ghost"
                badge={{ count: 3, position: 'bottom-left' }}
                title="Bottom Left"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Interactive Badge Example</h3>
            <div className="flex items-center gap-4">
              <Button 
                icon="notification-3-line" 
                variant="primary"
                badge={{ count: notificationCount, max: 99 }}
                onClick={() => setNotificationCount(prev => prev + 1)}
              >
                Notifications
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setNotificationCount(0)}
                icon="close-line"
              >
                Clear All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setNotificationCount(5)}
                icon="refresh-line"
              >
                Reset
              </Button>
              <span className="text-sm text-text-light">
                Click to increase notification count
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. LOADING STATES */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Loading States</h2>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button loading variant="primary">Loading</Button>
            <Button loading variant="success">Saving...</Button>
            <Button loading variant="danger">Deleting...</Button>
            <Button loading variant="outline">Processing</Button>
            <Button loading variant="ghost">Loading</Button>
            <Button loading variant="link">Please wait</Button>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-3">Icon Only Loading</h3>
            <div className="flex flex-wrap gap-4">
              <Button iconOnly loading icon="search-line" variant="primary" />
              <Button iconOnly loading icon="refresh-line" variant="outline" />
              <Button iconOnly loading icon="user-line" variant="ghost" />
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Async Action Example</h3>
            <div className="flex items-center gap-4">
              <Button
                loading={loadingState}
                onClick={handleAsyncClick}
                variant="primary"
                icon="refresh-line"
              >
                {loadingState ? 'Processing...' : `Submit (Clicked: ${clickCount})`}
              </Button>
              <p className="text-sm text-text-light">
                Click to simulate API call (2 second delay)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 9. DISABLED STATES */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Disabled States</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled variant="primary">Disabled Primary</Button>
          <Button disabled variant="success">Disabled Success</Button>
          <Button disabled variant="danger">Disabled Danger</Button>
          <Button disabled variant="outline">Disabled Outline</Button>
          <Button disabled variant="ghost">Disabled Ghost</Button>
          <Button disabled variant="link">Disabled Link</Button>
          <Button disabled iconOnly icon="user-line" variant="primary" title="Disabled Icon" />
          <Button disabled loading variant="primary">Disabled Loading</Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 10. FULL WIDTH BUTTONS */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Full Width Buttons</h2>
        <div className="space-y-3 max-w-md">
          <Button fullWidth variant="primary" icon="arrow-right-line">
            Primary Full Width
          </Button>
          <Button fullWidth variant="secondary" icon="settings-4-line">
            Secondary Full Width
          </Button>
          <Button fullWidth variant="danger" icon="delete-bin-line">
            Delete All Items
          </Button>
          <Button fullWidth pill variant="success" icon="download-line">
            Download Report
          </Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 11. BUTTON GROUPS / SEGMENTED CONTROLS */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Button Groups (Segmented Controls)</h2>
        
        <div className="space-y-4">
          <div className="flex">
            <Button radius="none" variant="outline" className="rounded-l-md">Left</Button>
            <Button radius="none" variant="outline" className="border-l-0">Middle</Button>
            <Button radius="none" variant="outline" className="border-l-0 rounded-r-md">Right</Button>
          </div>

          <div className="flex">
            <Button radius="none" variant="primary" className="rounded-l-md">Day</Button>
            <Button radius="none" variant="outline" className="border-l-0">Week</Button>
            <Button radius="none" variant="outline" className="border-l-0">Month</Button>
            <Button radius="none" variant="outline" className="border-l-0 rounded-r-md">Year</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="primary" size="sm">Active</Button>
            <Button variant="outline" size="sm">Pending</Button>
            <Button variant="outline" size="sm">Completed</Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 12. TOOLTIP TITLES */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Tooltip Titles</h2>
        <div className="flex flex-wrap gap-4">
          <Button title="This is a helpful tooltip" variant="primary" icon="information-line">
            Hover me
          </Button>
          <Button 
            iconOnly 
            icon="settings-4-line" 
            variant="ghost" 
            title="Settings (Ctrl + S)"
          />
          <Button 
            icon="question-line" 
            variant="outline" 
            title="Click for help documentation"
          >
            Help
          </Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 13. BUTTON TYPES (FORM ACTIONS) */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Button Types (Form Actions)</h2>
        <div className="flex flex-wrap gap-4">
          <Button type="button" variant="primary" icon="cursor-line">
            Button (type="button")
          </Button>
          <Button type="submit" variant="success" icon="check-line">
            Submit (type="submit")
          </Button>
          <Button type="reset" variant="danger" icon="close-line">
            Reset (type="reset")
          </Button>
        </div>
        <div className="bg-blue-50 p-3 rounded-md text-sm">
          <strong>Note:</strong> In a form context, type="submit" triggers form submission, 
          type="reset" resets form fields to their initial values.
        </div>
      </section>

      {/* ============================================ */}
      {/* 14. CUSTOM CLASS NAMES */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Custom Class Names</h2>
        <div className="flex flex-wrap gap-4">
          <Button className="shadow-lg" variant="primary" icon="star-line">
            With Shadow
          </Button>
          <Button className="font-bold uppercase tracking-wider" variant="outline" icon="award-line">
            Custom Styling
          </Button>
          <Button className="ring-2 ring-offset-2 ring-primary" variant="ghost" icon="focus-line">
            Focus Ring
          </Button>
          <Button className="animate-pulse" variant="danger" icon="flashlight-line">
            Pulsing Effect
          </Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 15. COMPLETE VARIANT × SIZE MATRIX */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Complete Variant × Size Matrix</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Variant</th>
                <th className="text-center py-2 px-3">Small</th>
                <th className="text-center py-2 px-3">Medium</th>
                <th className="text-center py-2 px-3">Large</th>
              </tr>
            </thead>
            <tbody>
              {(['primary', 'success', 'secondary', 'info', 'danger', 'ghost', 'outline', 'link', 'transparent'] as ButtonVariant[]).map(variant => (
                <tr key={variant} className="border-b">
                  <td className="py-2 px-3 font-medium capitalize">{variant}</td>
                  <td className="py-2 px-3 text-center">
                    <Button variant={variant} size="sm">{variant}</Button>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Button variant={variant} size="md">{variant}</Button>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Button variant={variant} size="lg">{variant}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================ */}
      {/* 16. REMIX ICON SHOWCASE */}
      {/* ============================================ */}
      <section className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-semibold">Remix Icon Showcase</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button icon="heart-line" variant="outline" fullWidth>Like</Button>
          <Button icon="star-line" variant="outline" fullWidth>Rate</Button>
          <Button icon="share-line" variant="outline" fullWidth>Share</Button>
          <Button icon="bookmark-line" variant="outline" fullWidth>Save</Button>
          <Button icon="thumb-up-line" variant="outline" fullWidth>Recommend</Button>
          <Button icon="flag-line" variant="outline" fullWidth>Report</Button>
          <Button icon="more-line" variant="outline" fullWidth>More</Button>
          <Button icon="menu-line" variant="outline" fullWidth>Menu</Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* 17. PRACTICAL USE CASES */}
      {/* ============================================ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Practical Use Cases</h2>
        
        {/* Social Media Interactions */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Social Media Actions</h3>
          <div className="flex gap-4">
            <Button 
              iconOnly 
              icon={isLiked ? "heart-fill" : "heart-line"} 
              variant={isLiked ? "danger" : "ghost"}
              onClick={() => setIsLiked(!isLiked)}
              title="Like"
            />
            <Button 
              iconOnly 
              icon={isBookmarked ? "bookmark-fill" : "bookmark-line"} 
              variant={isBookmarked ? "primary" : "ghost"}
              onClick={() => setIsBookmarked(!isBookmarked)}
              title="Bookmark"
            />
            <Button icon="share-line" variant="ghost">Share</Button>
            <Button icon="message-3-line" variant="ghost">Comment (12)</Button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Modal Actions</h3>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" icon="close-line">Cancel</Button>
            <Button variant="danger" icon="delete-bin-line">Delete</Button>
            <Button variant="primary" icon="check-line">Confirm</Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Form Actions</h3>
          <div className="flex gap-3">
            <Button variant="outline" icon="save-line">Save as Draft</Button>
            <Button variant="primary" icon="send-plane-line">Publish</Button>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Pagination Controls</h3>
          <div className="flex items-center gap-2">
            <Button iconOnly icon="arrow-left-s-line" variant="outline" size="sm" />
            <Button variant="primary" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">4</Button>
            <Button iconOnly icon="arrow-right-s-line" variant="outline" size="sm" />
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Action Bar (Table Actions)</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" icon="edit-line">Edit</Button>
            <Button size="sm" variant="outline" icon="file-copy-line">Duplicate</Button>
            <Button size="sm" variant="danger" icon="delete-bin-line">Delete</Button>
            <Button size="sm" variant="success" icon="download-line">Export</Button>
            <Button size="sm" variant="info" icon="printer-line">Print</Button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Navigation Buttons</h3>
          <div className="flex justify-between">
            <Button variant="ghost" icon="arrow-left-line">Previous</Button>
            <Button variant="ghost" icon="arrow-right-line" iconOnly={false}>Next</Button>
          </div>
        </div>

        {/* Notification Bell with Badge */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Notification Center</h3>
          <div className="flex items-center gap-6">
            <Button 
              iconOnly 
              icon="notification-3-line" 
              variant="ghost" 
              badge={{ count: notificationCount, max: 99 }}
              onClick={() => setNotificationCount(prev => prev + 1)}
              title="Notifications"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setNotificationCount(0)}
              icon="mail-check-line"
            >
              Mark all as read
            </Button>
            <span className="text-sm text-text-light">
              {notificationCount} unread notifications
            </span>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">File Upload</h3>
          <Button variant="outline" icon="upload-cloud-2-line" fullWidth>
            Click to Upload
          </Button>
        </div>

        {/* Loading States in Practice */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Loading States in Practice</h3>
          <div className="flex gap-3">
            <Button loading variant="primary" icon="save-line">Saving Changes</Button>
            <Button loading variant="success" icon="download-line">Downloading</Button>
            <Button loading variant="danger" icon="delete-bin-line">Deleting</Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 18. ACCESSIBILITY NOTES */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Accessibility Features</h2>
        <div className="bg-green-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
            <li>Focus-visible rings for keyboard navigation</li>
            <li>Proper ARIA attributes for loading states</li>
            <li>Title attribute support for tooltips</li>
            <li>Disabled states prevent interaction</li>
            <li>Semantic button elements with proper types</li>
            <li>Reduced motion considerations (active scale effect)</li>
            <li>Icon-only buttons include descriptive titles</li>
            <li>High contrast ratios for text and icons</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ButtonUsage;