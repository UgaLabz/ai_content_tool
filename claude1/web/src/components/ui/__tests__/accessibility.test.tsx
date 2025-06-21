import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { Button } from '../Button'
import { Input } from '../Input'
import { Label } from '../Label'
import { Textarea } from '../Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../AlertDialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card'
import { Badge } from '../Badge'
import { Skeleton } from '../Skeleton'
import { Toast, ToastContainer } from '../Toast'
import { Slider } from '../Slider'

describe('UI Components Accessibility', () => {
  describe('Button', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button onClick={vi.fn()}>Click me</Button>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should handle disabled state accessibly', () => {
      render(
        <Button disabled>Disabled Button</Button>
      )

      const button = screen.getByRole('button', { name: /disabled button/i })
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should support loading state with aria-busy', () => {
      render(
        <Button loading>Loading</Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
    })
  })

  describe('Form Controls', () => {
    it('should properly associate labels with inputs', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <Input id="test-input" type="text" />
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()

      const input = screen.getByLabelText(/test label/i)
      expect(input).toBeInTheDocument()
    })

    it('should handle validation states accessibly', () => {
      render(
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <span id="email-error" className="text-sm text-destructive">
            Invalid email format
          </span>
        </div>
      )

      const input = screen.getByLabelText(/email/i)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'email-error')
    })

    it('should handle required fields', () => {
      render(
        <div>
          <Label htmlFor="required-field">
            Required Field <span aria-label="required">*</span>
          </Label>
          <Input id="required-field" required aria-required="true" />
        </div>
      )

      const input = screen.getByLabelText(/required field/i)
      expect(input).toBeRequired()
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Select', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      
      // Open with keyboard
      await user.click(trigger)
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('option', { name: /option 1/i })).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('option', { name: /option 2/i })).toHaveFocus()

      // Select with Enter
      await user.keyboard('{Enter}')
      expect(trigger).toHaveTextContent('Option 2')
    })
  })

  describe('Tabs', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: /tab 1/i })
      const tab2 = screen.getByRole('tab', { name: /tab 2/i })
      const tab3 = screen.getByRole('tab', { name: /tab 3/i })

      // Click first tab
      await user.click(tab1)
      expect(tab1).toHaveFocus()

      // Arrow right
      await user.keyboard('{ArrowRight}')
      expect(tab2).toHaveFocus()
      expect(tab2).toHaveAttribute('aria-selected', 'true')

      // Arrow right again
      await user.keyboard('{ArrowRight}')
      expect(tab3).toHaveFocus()

      // Arrow left
      await user.keyboard('{ArrowLeft}')
      expect(tab2).toHaveFocus()
    })
  })

  describe('AlertDialog', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup()
      
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      // Focus should be on first focusable element (Cancel button)
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus()

      // Tab to confirm
      await user.tab()
      expect(screen.getByRole('button', { name: /confirm/i })).toHaveFocus()

      // Tab should cycle back to cancel
      await user.tab()
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus()
    })
  })

  describe('Card', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /card title/i })).toBeInTheDocument()
    })
  })

  describe('Badge', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Badge>Status</Badge>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should use appropriate ARIA attributes', () => {
      render(
        <Badge variant="destructive" role="status">
          Error
        </Badge>
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Error')
    })
  })

  describe('Slider', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          aria-label="Volume"
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <Slider
          defaultValue={[50]}
          max={100}
          step={10}
          aria-label="Volume"
          onValueChange={onChange}
        />
      )

      const slider = screen.getByRole('slider', { name: /volume/i })
      
      // Focus slider
      await user.click(slider)
      expect(slider).toHaveFocus()

      // Increase with arrow key
      await user.keyboard('{ArrowRight}')
      expect(onChange).toHaveBeenCalledWith([60])

      // Decrease with arrow key
      await user.keyboard('{ArrowLeft}')
      await user.keyboard('{ArrowLeft}')
      expect(onChange).toHaveBeenCalledWith([40])
    })

    it('should announce value changes', () => {
      render(
        <Slider
          value={[75]}
          max={100}
          aria-label="Progress"
          aria-valuetext="75 percent"
        />
      )

      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-valuenow', '75')
      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '100')
      expect(slider).toHaveAttribute('aria-valuetext', '75 percent')
    })
  })

  describe('Toast', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ToastContainer
          toasts={[
            {
              id: '1',
              title: 'Success',
              description: 'Operation completed',
              type: 'success',
            },
          ]}
          onClose={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should use appropriate ARIA live regions', () => {
      render(
        <ToastContainer
          toasts={[
            {
              id: '1',
              title: 'Error',
              description: 'Something went wrong',
              type: 'error',
            },
          ]}
          onClose={vi.fn()}
        />
      )

      const toast = screen.getByRole('status')
      expect(toast).toHaveAttribute('aria-live', 'polite')
      expect(toast).toHaveTextContent('Error')
      expect(toast).toHaveTextContent('Something went wrong')
    })

    it('should be dismissible with keyboard', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <ToastContainer
          toasts={[
            {
              id: '1',
              title: 'Info',
              description: 'FYI',
              type: 'info',
            },
          ]}
          onClose={onClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      expect(onClose).toHaveBeenCalledWith('1')
    })
  })

  describe('Skeleton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Skeleton className="h-4 w-full" />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be hidden from screen readers by default', () => {
      const { container } = render(
        <Skeleton className="h-4 w-full" />
      )

      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })
  })
})