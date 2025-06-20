import { UseFormReturn } from 'react-hook-form'
import { Upload, User } from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CharacterFormData } from '@/types/character.types'
import { AvatarUpload } from '../AvatarUpload'

interface BasicInfoStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors }, watch, setValue } = form
  const avatar = watch('avatar')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Let's start with the basics of your character
        </p>
      </div>

      <div className="space-y-4">
        {/* Avatar Upload */}
        <div>
          <Label>Avatar</Label>
          <AvatarUpload
            value={avatar}
            onChange={(url) => setValue('avatar', url)}
            className="mt-2"
          />
        </div>

        {/* Character Name */}
        <div>
          <Label htmlFor="name">Character Name *</Label>
          <Input
            id="name"
            placeholder="Enter character name"
            className="mt-2"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}