import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";

type CheckInPolicyValue = Record<string, any>;

type Props = {
  value: CheckInPolicyValue;
  onChange: (next: CheckInPolicyValue) => void;
};

const OPEN_OPTIONS = [
  { label: "Any time", value: null },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "Custom", value: "custom" },
] as const;

const CLOSE_OPTIONS = [
  { label: "At event end", value: 0 },
  { label: "2 hours after", value: 120 },
  { label: "Custom", value: "custom" },
] as const;

const getNumberOrDefault = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
};

const getOpenPreset = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const minutes = Number(value);
  if (minutes === 60 || minutes === 120) return minutes;
  return "custom";
};

const getClosePreset = (value: unknown) => {
  const minutes = Number(value ?? 0);
  if (minutes === 120) return 120;
  if (minutes !== 0 && Number.isFinite(minutes) && minutes >= 0) return "custom";
  return 0;
};

export default function EventCheckInPolicyControls({ value, onChange }: Props) {
  const openPreset = getOpenPreset(value.check_in_opens_minutes_before);
  const closePreset = getClosePreset(value.check_in_closes_minutes_after);
  const hasAgePrompt =
    Number(value.age_restriction || 0) > 0 || Boolean(value.guardian_required);
  const allowDuplicateOverride =
    value.check_in_allow_duplicate_override ?? true;

  const update = (patch: CheckInPolicyValue) => {
    onChange({
      ...value,
      check_in_enabled: true,
      check_in_record_blocked_attempts: true,
      ...patch,
    });
  };

  const ToggleRow = ({
    disabled,
    helper,
    label,
    selected,
    onPress,
  }: {
    disabled?: boolean;
    helper: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      className={`flex-row items-start rounded-lg border p-3 ${
        disabled
          ? "border-[#2A3546] bg-[#121B28] opacity-50"
          : "border-[#2A3546] bg-[#1A2432]"
      }`}
      onPress={disabled ? undefined : onPress}
    >
      <View
        className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border ${
          selected ? "border-primary bg-primary" : "border-gray-500"
        }`}
      >
        {selected && <View className="h-2 w-2 rounded-full bg-background" />}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-white">{label}</Text>
        <Text className="mt-1 text-xs leading-5 text-gray-400">{helper}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="rounded-lg border border-[#2A3546] bg-[#101824] p-4">
      <View className="mb-4 flex-row items-start">
        <View className="mr-3 rounded-lg bg-primary/15 p-3">
          <ShieldCheck size={20} color="#9EDD45" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-white">Check-in policy</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-400">
            Set when QR scanning opens, what staff must verify, and how duplicate
            scans are audited.
          </Text>
        </View>
      </View>

      <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-gray-500">
        Check-in opens
      </Text>
      <View className="mb-3 flex-row flex-wrap">
        {OPEN_OPTIONS.map((option) => {
          const active = openPreset === option.value;
          return (
            <TouchableOpacity
              key={option.label}
              className={`mb-2 mr-2 rounded-full px-3 py-2 ${
                active ? "bg-primary" : "bg-[#1A2432]"
              }`}
              onPress={() => {
                update({
                  check_in_opens_minutes_before:
                    option.value === "custom" ? 30 : option.value,
                });
              }}
            >
              <Text
                className={`text-xs font-bold ${
                  active ? "text-background" : "text-gray-300"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {openPreset === "custom" && (
        <TextInput
          className="mb-4 rounded-lg border border-[#2A3546] bg-[#1A2432] px-4 py-3 text-white"
          keyboardType="number-pad"
          placeholder="Minutes before first session"
          placeholderTextColor="#6B7280"
          value={String(value.check_in_opens_minutes_before ?? "")}
          onChangeText={(text) =>
            update({
              check_in_opens_minutes_before: getNumberOrDefault(text, 0),
            })
          }
        />
      )}

      <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-gray-500">
        Check-in closes
      </Text>
      <View className="mb-3 flex-row flex-wrap">
        {CLOSE_OPTIONS.map((option) => {
          const active = closePreset === option.value;
          return (
            <TouchableOpacity
              key={option.label}
              className={`mb-2 mr-2 rounded-full px-3 py-2 ${
                active ? "bg-primary" : "bg-[#1A2432]"
              }`}
              onPress={() => {
                update({
                  check_in_closes_minutes_after:
                    option.value === "custom" ? 60 : option.value,
                });
              }}
            >
              <Text
                className={`text-xs font-bold ${
                  active ? "text-background" : "text-gray-300"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {closePreset === "custom" && (
        <TextInput
          className="mb-4 rounded-lg border border-[#2A3546] bg-[#1A2432] px-4 py-3 text-white"
          keyboardType="number-pad"
          placeholder="Minutes after event end"
          placeholderTextColor="#6B7280"
          value={String(value.check_in_closes_minutes_after ?? "")}
          onChangeText={(text) =>
            update({
              check_in_closes_minutes_after: getNumberOrDefault(text, 0),
            })
          }
        />
      )}

      <View className="gap-2">
        <ToggleRow
          selected={value.check_in_enforce_session ?? true}
          label="Enforce session check-in"
          helper="Staff must check guests into the selected event session."
          onPress={() =>
            update({
              check_in_enforce_session: !(value.check_in_enforce_session ?? true),
            })
          }
        />
        <ToggleRow
          selected={Boolean(value.check_in_require_questionnaire)}
          label="Require questionnaire completion"
          helper="Guests must complete required event questions before check-in."
          onPress={() =>
            update({
              check_in_require_questionnaire: !value.check_in_require_questionnaire,
            })
          }
        />
        <ToggleRow
          selected={allowDuplicateOverride}
          label="Allow duplicate override"
          helper="Authorized staff can override a repeat scan when necessary."
          onPress={() =>
            update({
              check_in_allow_duplicate_override: !allowDuplicateOverride,
              check_in_require_override_reason: allowDuplicateOverride
                ? false
                : true,
            })
          }
        />
        <ToggleRow
          disabled={!allowDuplicateOverride}
          selected={
            allowDuplicateOverride &&
            (value.check_in_require_override_reason ?? true)
          }
          label="Require override reason"
          helper="Every duplicate override must include an audit note."
          onPress={() =>
            update({
              check_in_require_override_reason: !(
                value.check_in_require_override_reason ?? true
              ),
            })
          }
        />
      </View>

      {hasAgePrompt && (
        <View className="mt-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3">
          <Text className="text-sm font-semibold text-[#FCD34D]">
            Age/guardian prompt enabled
          </Text>
          <Text className="mt-1 text-xs leading-5 text-[#FDE68A]">
            Staff will see the age or guardian verification reminder before
            completing check-in.
          </Text>
        </View>
      )}
    </View>
  );
}
