import type { UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import type { CharacterFormData } from '@/types/character.types'
import { AvatarUpload } from '../AvatarUpload'

interface BasicInfoStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors }, watch, setValue } = form
  const avatar = watch('avatar')

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Basic Information</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Let's start with the basics of your character
        </p>
      </div>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label className="text-base">Avatar</Label>
          <AvatarUpload
            value={avatar}
            onChange={(url) => setValue('avatar', url)}
          />
        </div>

        {/* Character Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            Character Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter character name"
            className="bg-background"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}