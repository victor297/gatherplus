import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Radar,
  Search,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useCheckInBookingMutation,
  useGetCheckInDashboardQuery,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { getStringParam } from "@/utils/routeParams";

const PAGE_SIZE = 12;

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const extractBookingCode = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    const code =
      parsed?.code ||
      parsed?.bookingCode ||
      parsed?.booking_code ||
      parsed?.ticketCode ||
      parsed?.ticket_code;
    if (code) return String(code).trim();
  } catch {
    // QR payload is commonly a plain code or URL; JSON is optional.
  }

  const match = raw.match(/GTP[_-][A-Za-z0-9_-]+/i);
  return match?.[0] || raw;
};

export default function EventCheckInScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = getStringParam(id);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sessionId, setSessionId] = useState<string | number | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    code: string;
    method: string;
  } | null>(null);
  const [pendingOverride, setPendingOverride] = useState<{
    code: string;
    method: string;
    message: string;
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [blockedNotice, setBlockedNotice] = useState<{
    title: string;
    message: string;
    code?: string;
  } | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const { data, isFetching, isLoading, refetch } = useGetCheckInDashboardQuery(
    {
      eventId,
      page,
      search,
      session_id: sessionId,
      size: PAGE_SIZE,
    },
    { skip: !eventId }
  );
  const [checkInBooking, { isLoading: isCheckingIn }] = useCheckInBookingMutation();

  const body = data?.body || {};
  const event = body.event || {};
  const metrics = body.metrics || {};
  const checkInPolicy = body.checkInPolicy || {};
  const policy = checkInPolicy.policy || {};
  const policyWarnings = getArray(checkInPolicy.warnings);
  const sessionStats = getArray(body.sessionStats);
  const history = body.history || {};
  const rows = getArray(history.result);
  const totalPages = Math.max(1, Number(history.totalPages || 1));
  const checkInRate = Number(metrics.checkInRate || 0);
  const activeWindow = checkInPolicy.activeWindow || null;
  const nextWindow = checkInPolicy.nextWindow || null;
  const displayedWindow = activeWindow || nextWindow;
  const windowTitle = activeWindow
    ? "Check-in is open now"
    : nextWindow?.opensAt
      ? `Check-in opens at ${formatDate(nextWindow.opensAt)}`
      : "Check-in window is not open";
  const windowDetail = displayedWindow
    ? `${displayedWindow.sessionName || "Event"}${
        displayedWindow.opensAt ? ` from ${formatDate(displayedWindow.opensAt)}` : ""
      }${
        displayedWindow.closesAt ? ` to ${formatDate(displayedWindow.closesAt)}` : ""
      }`
    : "No active check-in window is available for this event yet.";

  const selectedSessionName = useMemo(() => {
    if (!sessionId) return "All sessions";
    const match = sessionStats.find((item: any) => String(item.session?.id) === String(sessionId));
    return match?.session?.name || "Selected session";
  }, [sessionId, sessionStats]);

  const approvalWarnings = useMemo(() => {
    const items = policyWarnings
      .map((warning: any) => warning?.message)
      .filter(Boolean) as string[];

    if (policy.enabled === false) items.unshift("Check-in is disabled for this event.");
    if (checkInPolicy.active === false && nextWindow?.opensAt) {
      items.unshift(`Check-in opens at ${formatDate(nextWindow.opensAt)}.`);
    }
    if (policy.requireQuestionnaire) {
      items.push("Required questionnaire completion will be checked before entry.");
    }
    if (Number(event.age_restriction || 0) > 0 || event.guardian_required) {
      items.push("Staff must verify age or guardian requirements at the door.");
    }

    return Array.from(new Set(items));
  }, [
    checkInPolicy.active,
    event.age_restriction,
    event.guardian_required,
    nextWindow?.opensAt,
    policy.enabled,
    policy.requireQuestionnaire,
    policyWarnings,
  ]);

  const submitCheckIn = async (
    override = false,
    providedCode?: string,
    checkInMethod = "MANUAL",
    managerReason?: string
  ) => {
    const normalizedCode = extractBookingCode(providedCode || code);
    if (!normalizedCode) {
      Alert.alert("Booking code required", "Enter or scan a booking code before checking in.");
      return;
    }
    const reasonText = managerReason?.trim() || "";
    if (override && !reasonText) {
      Alert.alert("Override reason required", "Enter a manager reason before approving this duplicate check-in.");
      return;
    }

    try {
      const response = await checkInBooking({
        code: normalizedCode,
        event_id: Number(eventId),
        method: override ? "MANUAL_OVERRIDE" : checkInMethod,
        notes: notes.trim() || undefined,
        override,
        override_reason: override ? reasonText : undefined,
        session_id: sessionId,
      }).unwrap();
      const booking = response?.body?.booking || {};
      setCode("");
      setNotes("");
      setOverrideReason("");
      setPendingApproval(null);
      setPendingOverride(null);
      setBlockedNotice(null);
      refetch();
      Alert.alert(
        response?.body?.duplicate ? "Duplicate override recorded" : "Checked in",
        `${booking.fullname || booking.email || "Attendee"} is now recorded for ${selectedSessionName}.`
      );
    } catch (error: any) {
      const bodyError = error?.data?.body;
      const isObjectError = typeof bodyError === "object" && bodyError !== null;
      const errorCode = isObjectError ? bodyError.code : undefined;
      const errorMessage = isObjectError
        ? bodyError.message || "Please verify the booking code."
        : bodyError || error?.data?.message || "Please verify the booking code.";

      if (isObjectError && (bodyError.duplicate || bodyError.code === "DUPLICATE_CHECK_IN")) {
        if (bodyError.canOverride === false) {
          setBlockedNotice({
            title: "Check-in blocked",
            message: bodyError.message || "Duplicate override is disabled for this event.",
            code: bodyError.code,
          });
          Alert.alert(
            "Check-in blocked",
            bodyError?.message || "Duplicate override is disabled for this event."
          );
          return;
        }
        setPendingOverride({
          code: normalizedCode,
          method: checkInMethod,
          message:
            bodyError.message ||
            "This ticket has already been checked in. Manager approval is required before recording a duplicate override.",
        });
        setOverrideReason("");
        setBlockedNotice(null);
        return;
      }
      setBlockedNotice({
        title: errorCode ? "Check-in blocked" : "Check-in failed",
        message: errorMessage,
        code: errorCode,
      });
      Alert.alert(
        errorCode ? "Check-in blocked" : "Check-in failed",
        errorMessage
      );
    }
  };

  const requestCheckIn = (providedCode?: string, checkInMethod = "MANUAL") => {
    const normalizedCode = extractBookingCode(providedCode || code);
    if (!normalizedCode) {
      Alert.alert("Booking code required", "Enter or scan a booking code before checking in.");
      return;
    }

    if (approvalWarnings.length) {
      setPendingApproval({ code: normalizedCode, method: checkInMethod });
      return;
    }

    void submitCheckIn(false, normalizedCode, checkInMethod);
  };

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          "Camera permission needed",
          "Allow camera access to scan attendee QR codes. Manual check-in still works."
        );
        return;
      }
    }

    setScanLocked(false);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const scannedCode = extractBookingCode(result.data);
    if (!scannedCode || scanLocked || isCheckingIn) return;

    setScanLocked(true);
    setCode(scannedCode);
    setScannerOpen(false);

    requestCheckIn(scannedCode, "QR_SCAN");
    setTimeout(() => setScanLocked(false), 900);
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Smart check-in"
      subtitle="Verify tickets, prevent duplicates, and track arrivals in real time."
      stats={[
        { label: "Bookings", value: metrics.totalBookings || 0 },
        { label: "Checked in", value: metrics.checkedInCount || 0 },
        { label: "Remaining", value: metrics.remaining || 0 },
        { label: "Duplicates", value: metrics.duplicates || 0 },
        { label: "Blocked", value: metrics.blockedAttempts || 0 },
      ]}
    >
      <TouchableOpacity
        className="bg-primary rounded-xl py-4 px-4 mb-4 flex-row items-center justify-center"
        onPress={() => router.push(`/profile/events/${eventId}/command-center` as any)}
      >
        <Radar color="#020817" size={18} />
        <Text className="text-background text-center font-bold ml-2">
          Event-day Command Center
        </Text>
      </TouchableOpacity>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-primary text-xs font-bold tracking-widest uppercase">
              Entry policy
            </Text>
            <Text className="text-white text-xl font-semibold mt-1">
              {policy.enabled === false ? "Check-in disabled" : "Scanner rules active"}
            </Text>
            <Text className="text-gray-400 mt-1 leading-6">
              Confirmed tickets are required. Session, questionnaire, duplicate, age, and identity rules are enforced here.
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${
              policy.enabled === false || checkInPolicy.active === false
                ? "bg-amber-500/20"
                : "bg-primary/20"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                policy.enabled === false || checkInPolicy.active === false
                  ? "text-amber-300"
                  : "text-primary"
              }`}
            >
              {policy.enabled === false
                ? "OFF"
                : checkInPolicy.active === false
                  ? "WAIT"
                  : "READY"}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2 mt-4">
          <PolicyChip label="Tickets" value="Confirmed only" />
          <PolicyChip
            label="Session"
            value={policy.enforceSession === false ? "Flexible" : "Match required"}
          />
          <PolicyChip
            label="Questionnaire"
            value={policy.requireQuestionnaire ? "Required" : "Optional"}
          />
          <PolicyChip
            label="Override"
            value={policy.allowDuplicateOverride === false ? "Disabled" : "Reason required"}
          />
        </View>
        <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-4">
          <Text className="text-white font-semibold">{windowTitle}</Text>
          <Text className="text-gray-400 mt-1 leading-5">{windowDetail}</Text>
        </View>
        {policyWarnings.length ? (
          <View className="mt-4">
            {policyWarnings.map((warning: any) => (
              <View
                key={warning.code || warning.message}
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-2 flex-row"
              >
                <AlertTriangle color="#F59E0B" size={18} />
                <Text className="text-amber-100 font-semibold ml-2 flex-1 leading-5">
                  {warning.message}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-start">
          <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
            <CheckCircle2 color="#020817" size={24} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white text-xl font-semibold">Manual / QR code check-in</Text>
            <Text className="text-gray-400 mt-1 leading-6">
              Scan support can pass the ticket code here. Duplicate check-ins are blocked unless you
              explicitly override.
            </Text>
          </View>
        </View>

        <View className="mt-5">
          <Text className="text-gray-300 font-semibold mb-2">Session</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              className={`rounded-full px-4 py-2 border ${
                !sessionId ? "bg-primary border-primary" : "border-[#2E3A4D]"
              }`}
              onPress={() => {
                setPage(1);
                setSessionId(undefined);
              }}
            >
              <Text className={!sessionId ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                All sessions
              </Text>
            </TouchableOpacity>
            {sessionStats.map((item: any) => (
              <TouchableOpacity
                key={item.session?.id}
                className={`rounded-full px-4 py-2 border ${
                  String(sessionId) === String(item.session?.id)
                    ? "bg-primary border-primary"
                    : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setSessionId(item.session?.id);
                }}
              >
                <Text
                  className={
                    String(sessionId) === String(item.session?.id)
                      ? "text-background font-bold"
                      : "text-gray-300 font-semibold"
                  }
                >
                  {item.session?.name || "Session"} - {item.checkedIn || 0}/{item.capacity || 0}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-4 text-white mt-5"
          placeholder="Enter booking code, for example GTP_..."
          placeholderTextColor="#728097"
          autoCapitalize="characters"
          value={code}
          onChangeText={(value) => setCode(value.trim())}
          onSubmitEditing={() => requestCheckIn(undefined, "MANUAL")}
        />
        <TouchableOpacity
          className="border border-primary/50 rounded-xl py-4 mt-3 flex-row items-center justify-center"
          disabled={isCheckingIn}
          onPress={openScanner}
        >
          <Camera color="#9EDD45" size={18} />
          <Text className="text-primary text-center font-bold ml-2">
            Scan QR with camera
          </Text>
        </TouchableOpacity>
        <TextInput
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3"
          placeholder="Optional staff note"
          placeholderTextColor="#728097"
          value={notes}
          onChangeText={setNotes}
        />
        {blockedNotice ? (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
            <Text className="text-red-200 font-bold">
              {blockedNotice.title}
              {blockedNotice.code ? ` - ${blockedNotice.code}` : ""}
            </Text>
            <Text className="text-gray-300 mt-1 leading-5">{blockedNotice.message}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          className="border border-amber-500/40 rounded-xl py-4 mt-3 flex-row items-center justify-center"
          disabled={isCheckingIn}
          onPress={() => {
            const normalizedCode = extractBookingCode(code);
            if (!normalizedCode) {
              Alert.alert("Booking code required", "Enter a booking code before requesting manager override.");
              return;
            }
            setPendingOverride({
              code: normalizedCode,
              method: "MANUAL",
              message: "Manager override should only be used after identity and ticket ownership are verified.",
            });
            setOverrideReason("");
          }}
        >
          <ShieldAlert color="#F59E0B" size={18} />
          <Text className="text-amber-200 text-center font-bold ml-2">Manager override</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 mt-4 disabled:opacity-50"
          disabled={isCheckingIn}
          onPress={() => requestCheckIn(undefined, "MANUAL")}
        >
          <Text className="text-background text-center font-bold">
            {isCheckingIn ? "Checking..." : "Check in attendee"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View className="flex-1 bg-background">
          <View className="px-5 pt-12 pb-4 flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">Scan ticket QR</Text>
            <TouchableOpacity
              className="bg-[#1A2432] rounded-full px-4 py-2"
              onPress={() => setScannerOpen(false)}
            >
              <Text className="text-primary font-bold">Close</Text>
            </TouchableOpacity>
          </View>
          <View className="mx-5 overflow-hidden rounded-2xl border border-[#243044] bg-[#111823]">
            <CameraView
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarcodeScanned}
              style={{ height: 420, width: "100%" }}
            />
          </View>
          <View className="mx-5 mt-4 rounded-2xl border border-[#243044] bg-[#111823] p-4">
            <Text className="text-white font-bold">Point camera at the ticket QR code.</Text>
            <Text className="text-gray-400 mt-1 leading-6">
              GatherPlux will read the booking code and check the attendee in automatically.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(pendingApproval)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingApproval(null)}
      >
        <View className="flex-1 bg-black/70 px-5 justify-center">
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5">
            <View className="flex-row items-start">
              <View className="w-12 h-12 rounded-2xl bg-amber-500/20 items-center justify-center">
                <AlertTriangle color="#F59E0B" size={24} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-xl font-semibold">Review before check-in</Text>
                <Text className="text-gray-400 mt-1 leading-5">
                  Confirm these warnings before approving booking code{" "}
                  <Text className="text-primary font-bold">{pendingApproval?.code}</Text>.
                </Text>
              </View>
            </View>
            <View className="mt-4">
              {approvalWarnings.map((warning) => (
                <View
                  key={warning}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-2"
                >
                  <Text className="text-amber-100 font-semibold leading-5">{warning}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl py-4"
                onPress={() => setPendingApproval(null)}
              >
                <Text className="text-white text-center font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-4"
                disabled={isCheckingIn}
                onPress={() => {
                  const pending = pendingApproval;
                  if (!pending) return;
                  void submitCheckIn(false, pending.code, pending.method);
                }}
              >
                <Text className="text-background text-center font-bold">
                  {isCheckingIn ? "Checking..." : "Approve"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(pendingOverride)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPendingOverride(null);
          setOverrideReason("");
        }}
      >
        <View className="flex-1 bg-black/70 px-5 justify-center">
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5">
            <View className="flex-row items-start">
              <View className="w-12 h-12 rounded-2xl bg-red-500/20 items-center justify-center">
                <ShieldAlert color="#F87171" size={24} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-xl font-semibold">Manager override</Text>
                <Text className="text-gray-400 mt-1 leading-5">
                  {pendingOverride?.message || "Approve a duplicate only after a trusted organizer verifies the attendee."}
                </Text>
              </View>
            </View>
            <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-4">
              <Text className="text-amber-200 text-xs font-bold tracking-widest uppercase">Booking code</Text>
              <Text className="text-white font-mono font-bold mt-1">{pendingOverride?.code}</Text>
            </View>
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-4 text-white mt-4 min-h-[96px]"
              placeholder="Manager reason, for example: attendee re-entered after identity check"
              placeholderTextColor="#728097"
              multiline
              textAlignVertical="top"
              value={overrideReason}
              onChangeText={setOverrideReason}
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl py-4"
                onPress={() => {
                  setPendingOverride(null);
                  setOverrideReason("");
                }}
              >
                <Text className="text-white text-center font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-4"
                disabled={isCheckingIn}
                onPress={() => {
                  const pending = pendingOverride;
                  const reason = overrideReason.trim();
                  if (!pending) return;
                  if (!reason) {
                    Alert.alert("Override reason required", "Enter a manager reason before approving this duplicate.");
                    return;
                  }
                  void submitCheckIn(true, pending.code, pending.method, reason);
                }}
              >
                <Text className="text-white text-center font-bold">
                  {isCheckingIn ? "Approving..." : "Approve"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-semibold">Arrival progress</Text>
            <Text className="text-gray-400 mt-1">{checkInRate}% checked in</Text>
          </View>
          <ShieldAlert color={metrics.duplicates ? "#F59E0B" : "#9EDD45"} size={24} />
        </View>
        <View className="bg-[#1A2432] h-3 rounded-full mt-4 overflow-hidden">
          <View className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, checkInRate)}%` }} />
        </View>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Check-in history</Text>
          <Text className="text-gray-400 mt-1">Recent arrivals, duplicate overrides, and staff actions.</Text>
          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search booking code, name, or email"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>
        </View>

        {isFetching && !isLoading ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {rows.length ? (
          <FlatList
            data={rows}
            keyExtractor={(item: any, index) => String(item.id || index)}
            scrollEnabled={false}
            renderItem={({ item }: { item: any }) => {
              const booking = item.booking || {};
              return (
                <View className="p-4 border-b border-[#243044]">
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 rounded-xl bg-[#8B6BFF]/20 items-center justify-center">
                      <Ticket color="#A993FF" size={22} />
                    </View>
                    <View className="ml-3 flex-1">
                      <View className="flex-row justify-between">
                        <Text className="text-white font-semibold flex-1 pr-2">
                          {booking.fullname || booking.email || "Checked-in attendee"}
                        </Text>
                        <View className={item.duplicate ? "bg-amber-500/20 rounded-full px-3 py-1" : "bg-primary/20 rounded-full px-3 py-1"}>
                          <Text className={item.duplicate ? "text-amber-300 text-xs font-bold" : "text-primary text-xs font-bold"}>
                            {item.duplicate ? "OVERRIDE" : "VERIFIED"}
                          </Text>
                        </View>
                      </View>
                      <Info icon={<Ticket color="#728097" size={15} />} text={`${booking.ticket?.name || "Ticket"} - ${booking.code || "No code"}`} />
                      <Info icon={<CalendarDays color="#728097" size={15} />} text={`Checked in ${formatDate(item.checked_in_at)}`} />
                      {item.duplicate && (item.override_reason || item.notes) ? (
                        <Text className="text-amber-200 mt-2 leading-5">
                          Manager note: {item.override_reason || item.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <View className="p-8 items-center">
            <Users color="#8B6BFF" size={36} />
            <Text className="text-white text-lg font-semibold mt-3">No check-ins yet</Text>
            <Text className="text-gray-400 text-center mt-1">
              Arrivals will appear here as your team checks attendees in.
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page <= 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft color="#E5E7EB" size={17} />
            <Text className="text-white ml-1">Previous</Text>
          </TouchableOpacity>
          <Text className="text-gray-300">Page {page} of {totalPages}</Text>
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page >= totalPages}
            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <Text className="text-white mr-1">Next</Text>
            <ChevronRight color="#E5E7EB" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </ProfileFoundationScreen>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center mt-2">
      {icon}
      <Text className="text-gray-400 ml-2 flex-1">{text}</Text>
    </View>
  );
}

function PolicyChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 py-2 min-w-[46%] flex-1">
      <Text className="text-primary text-[10px] font-bold tracking-widest uppercase">
        {label}
      </Text>
      <Text className="text-white font-semibold mt-1">{value}</Text>
    </View>
  );
}
