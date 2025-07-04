import * as React from 'react';
import { useThemeProps } from '@mui/material/styles';
import { DefaultizedProps } from '@mui/x-internals/types';
import { DateOrTimeView, DateTimeValidationError } from '../models';
import { usePickerAdapter } from '../hooks/usePickerAdapter';
import {
  DateCalendarSlots,
  DateCalendarSlotProps,
  ExportedDateCalendarProps,
} from '../DateCalendar/DateCalendar.types';
import { BasePickerInputProps } from '../internals/models/props/basePickerProps';
import { DateTimePickerTabs, DateTimePickerTabsProps } from './DateTimePickerTabs';
import { LocalizedComponent, PickersInputLocaleText } from '../locales/utils/pickersLocaleTextApi';
import {
  DateTimePickerToolbar,
  DateTimePickerToolbarProps,
  ExportedDateTimePickerToolbarProps,
} from './DateTimePickerToolbar';
import { PickerViewRendererLookup } from '../internals/hooks/usePicker';
import { DateViewRendererProps } from '../dateViewRenderers';
import { TimeViewRendererProps } from '../timeViewRenderers';
import { applyDefaultViewProps } from '../internals/utils/views';
import { BaseClockProps, DigitalTimePickerProps } from '../internals/models/props/time';
import { DateOrTimeViewWithMeridiem, PickerValue, TimeViewWithMeridiem } from '../internals/models';
import {
  ExportedValidateDateTimeProps,
  ValidateDateTimePropsToDefault,
} from '../validation/validateDateTime';
import { resolveTimeViewsResponse } from '../internals/utils/date-time-utils';
import { DigitalClockSlotProps, DigitalClockSlots } from '../DigitalClock';
import {
  MultiSectionDigitalClockSlotProps,
  MultiSectionDigitalClockSlots,
} from '../MultiSectionDigitalClock';
import { useApplyDefaultValuesToDateTimeValidationProps } from '../managers/useDateTimeManager';

export interface BaseDateTimePickerSlots
  extends DateCalendarSlots,
    DigitalClockSlots,
    MultiSectionDigitalClockSlots {
  /**
   * Tabs enabling toggling between date and time pickers.
   * @default DateTimePickerTabs
   */
  tabs?: React.ElementType<DateTimePickerTabsProps>;
  /**
   * Custom component for the toolbar rendered above the views.
   * @default DateTimePickerToolbar
   */
  toolbar?: React.JSXElementConstructor<DateTimePickerToolbarProps>;
}

export interface BaseDateTimePickerSlotProps
  extends DateCalendarSlotProps,
    DigitalClockSlotProps,
    MultiSectionDigitalClockSlotProps {
  /**
   * Props passed down to the tabs component.
   */
  tabs?: DateTimePickerTabsProps;
  /**
   * Props passed down to the toolbar component.
   */
  toolbar?: ExportedDateTimePickerToolbarProps;
}

export type DateTimePickerViewRenderers<TView extends DateOrTimeViewWithMeridiem> =
  PickerViewRendererLookup<
    PickerValue,
    TView,
    Omit<DateViewRendererProps<TView>, 'slots' | 'slotProps'> &
      Omit<
        TimeViewRendererProps<TimeViewWithMeridiem, BaseClockProps<TimeViewWithMeridiem>>,
        'slots' | 'slotProps'
      >
  >;

export interface BaseDateTimePickerProps
  extends Omit<
      BasePickerInputProps<PickerValue, DateOrTimeViewWithMeridiem, DateTimeValidationError>,
      'views'
    >,
    Omit<ExportedDateCalendarProps, 'onViewChange' | 'views'>,
    DigitalTimePickerProps,
    ExportedValidateDateTimeProps {
  /**
   * Display ampm controls under the clock (instead of in the toolbar).
   * @default true on desktop, false on mobile
   */
  ampmInClock?: boolean;
  /**
   * Overridable component slots.
   * @default {}
   */
  slots?: BaseDateTimePickerSlots;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: BaseDateTimePickerSlotProps;
  /**
   * Define custom view renderers for each section.
   * If `null`, the section will only have field editing.
   * If `undefined`, internally defined view will be used.
   */
  viewRenderers?: Partial<DateTimePickerViewRenderers<DateOrTimeViewWithMeridiem>>;
  /**
   * Available views.
   */
  views?: readonly DateOrTimeView[];
}

type UseDateTimePickerDefaultizedProps<Props extends BaseDateTimePickerProps> = LocalizedComponent<
  Omit<
    DefaultizedProps<Props, 'openTo' | 'orientation' | 'ampm' | ValidateDateTimePropsToDefault>,
    'views'
  >
> & {
  shouldRenderTimeInASingleColumn: boolean;
  views: readonly DateOrTimeViewWithMeridiem[];
};

export function useDateTimePickerDefaultizedProps<Props extends BaseDateTimePickerProps>(
  props: Props,
  name: string,
): UseDateTimePickerDefaultizedProps<Props> {
  const adapter = usePickerAdapter();
  const themeProps = useThemeProps({
    props,
    name,
  });

  const validationProps = useApplyDefaultValuesToDateTimeValidationProps(themeProps);
  const ampm = themeProps.ampm ?? adapter.is12HourCycleInCurrentLocale();

  const localeText = React.useMemo<PickersInputLocaleText | undefined>(() => {
    if (themeProps.localeText?.toolbarTitle == null) {
      return themeProps.localeText;
    }

    return {
      ...themeProps.localeText,
      dateTimePickerToolbarTitle: themeProps.localeText.toolbarTitle,
    };
  }, [themeProps.localeText]);

  const { openTo, views: defaultViews } = applyDefaultViewProps<DateOrTimeViewWithMeridiem>({
    views: themeProps.views,
    openTo: themeProps.openTo,
    defaultViews: ['year', 'day', 'hours', 'minutes'],
    defaultOpenTo: 'day',
  });

  const {
    shouldRenderTimeInASingleColumn,
    thresholdToRenderTimeInASingleColumn,
    views,
    timeSteps,
  } = resolveTimeViewsResponse<any, DateOrTimeViewWithMeridiem>({
    thresholdToRenderTimeInASingleColumn: themeProps.thresholdToRenderTimeInASingleColumn,
    ampm,
    timeSteps: themeProps.timeSteps,
    views: defaultViews,
  });

  return {
    ...themeProps,
    ...validationProps,
    timeSteps,
    openTo,
    shouldRenderTimeInASingleColumn,
    thresholdToRenderTimeInASingleColumn,
    views,
    ampm,
    localeText,
    orientation: themeProps.orientation ?? 'portrait',
    slots: {
      toolbar: DateTimePickerToolbar,
      tabs: DateTimePickerTabs,
      ...themeProps.slots,
    },
    slotProps: {
      ...themeProps.slotProps,
      toolbar: {
        ampm,
        ...themeProps.slotProps?.toolbar,
      },
    },
  };
}
