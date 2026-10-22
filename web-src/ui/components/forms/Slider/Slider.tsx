import { ComponentProps } from 'react';
import RcSlider from 'rc-slider';

import { SliderTooltip } from '@/ui/components/feedback/Tip/SliderTooltip';

import styles from './Slider.module.css';

import 'rc-slider/assets/index.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number | number[]) => void;
  dataCy: string;
  // true if you want to always show the tooltip
  visibleTooltip?: boolean;
  disabled?: boolean;
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  dataCy,
  visibleTooltip: visible,
  disabled,
}: Props) {
  const marks = {
    [min]: visible && value / max < 0.1 ? '' : translateMinValue(min),
    [max]: visible && value / max > 0.9 ? '' : max.toString(),
  };

  return (
    <div className={styles.root} data-cy={dataCy}>
      <RcSlider
        handleRender={visible ? sliderTooltip : undefined}
        min={min}
        max={max}
        marks={marks}
        step={step}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function translateMinValue(value: number) {
  if (value === 0) {
    return 'unlimited';
  }
  return value.toString();
}

type HandleRender = NonNullable<ComponentProps<typeof RcSlider>['handleRender']>;

function sliderTooltip(
  node: Parameters<HandleRender>[0],
  handleProps: Parameters<HandleRender>[1]
) {
  return (
    <SliderTooltip
      value={translateMinValue(handleProps.value)}
      child={node}
      delay={0}
    />
  );
}
