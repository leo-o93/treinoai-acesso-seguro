
import React from 'react'
import { Slider } from '@/components/ui/slider'

interface FeedbackSliderProps {
  label: string
  value: number[]
  onValueChange: (value: number[]) => void
  leftLabel: string
  rightLabel: string
  max?: number
  min?: number
  step?: number
}

const FeedbackSlider: React.FC<FeedbackSliderProps> = ({
  label,
  value,
  onValueChange,
  leftLabel,
  rightLabel,
  max = 10,
  min = 1,
  step = 1
}) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        {label}
      </label>
      <Slider
        value={value}
        onValueChange={onValueChange}
        max={max}
        min={min}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{leftLabel}</span>
        <span className="font-medium">{value[0]}/{max}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

export default FeedbackSlider
