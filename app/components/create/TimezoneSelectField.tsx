import React, { useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Check, ChevronDown, X } from "lucide-react-native";
import { TIMEZONE_GROUPS } from "@/utils/newEventForm";

type Props = {
  value?: string;
  onChange: (timezone: string) => void;
  hasError?: boolean;
  label?: string;
};

const allTimezones = TIMEZONE_GROUPS.flatMap((group) => group.options);

export default function TimezoneSelectField({
  value,
  onChange,
  hasError,
  label = "Time zone",
}: Props) {
  const [visible, setVisible] = useState(false);
  const selected = useMemo(
    () => allTimezones.find((option) => option.value === value),
    [value],
  );
  const hasCustomTimezone = Boolean(
    value && !allTimezones.some((option) => option.value === value),
  );

  const chooseTimezone = (timezone: string) => {
    onChange(timezone);
    setVisible(false);
  };

  return (
    <View>
      <Text className="my-2 text-white">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        className={`flex-row items-center justify-between rounded-lg border bg-[#1A2432] px-4 py-3 ${
          hasError ? "border-red-500" : "border-[#2A3546]"
        }`}
        onPress={() => setVisible(true)}
      >
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-white">
            {selected?.label || value || "Select event time zone"}
          </Text>
          <Text className="mt-1 text-xs text-gray-400">
            {value || "Used for online access, reminders, and calendars"}
          </Text>
        </View>
        <ChevronDown size={18} color="#9EDD45" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            className="rounded-t-2xl border border-[#243246] bg-[#0B1422] p-4"
            style={{ maxHeight: "78%" }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-black text-white">
                  Select time zone
                </Text>
                <Text className="mt-1 text-sm text-gray-400">
                  Choose the event time zone shown to attendees.
                </Text>
              </View>
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-lg bg-[#162233]"
                onPress={() => setVisible(false)}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {hasCustomTimezone ? (
                <TouchableOpacity
                  className="mb-3 flex-row items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-4 py-3"
                  onPress={() => chooseTimezone(String(value))}
                >
                  <View>
                    <Text className="font-bold text-white">
                      Current custom timezone
                    </Text>
                    <Text className="mt-1 text-xs text-gray-300">{value}</Text>
                  </View>
                  <Check size={18} color="#9EDD45" />
                </TouchableOpacity>
              ) : null}

              {TIMEZONE_GROUPS.map((group) => (
                <View key={group.label} className="mb-5">
                  <Text className="mb-2 text-xs font-black uppercase tracking-[2px] text-gray-500">
                    {group.label}
                  </Text>
                  <View className="overflow-hidden rounded-lg border border-[#243246]">
                    {group.options.map((option) => {
                      const active = option.value === value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          className={`flex-row items-center justify-between border-b border-[#243246] px-4 py-3 ${
                            active ? "bg-primary/15" : "bg-[#111B2A]"
                          }`}
                          onPress={() => chooseTimezone(option.value)}
                        >
                          <View className="flex-1 pr-3">
                            <Text className="font-semibold text-white">
                              {option.label}
                            </Text>
                            <Text className="mt-1 text-xs text-gray-400">
                              {option.value}
                            </Text>
                          </View>
                          {active ? <Check size={18} color="#9EDD45" /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
