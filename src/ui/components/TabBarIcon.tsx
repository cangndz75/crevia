import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

type TabBarIconProps = {
  name: TabIconName;
  focusedName?: TabIconName;
  color: string;
  size?: number;
  focused?: boolean;
};

export function TabBarIcon({
  name,
  focusedName,
  color,
  size = 22,
  focused = false,
}: TabBarIconProps) {
  const iconName = focused && focusedName ? focusedName : name;

  return <Ionicons name={iconName} size={size} color={color} />;
}
