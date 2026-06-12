import React from "react";
import { Image, Share, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Clock,
  Edit3,
  FileQuestion,
  MessageSquare,
  Radar,
  ScanLine,
  MapPin,
  Share2,
  Tag,
  Ticket,
  Users,
  Video,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetNewEventQuery } from "@/redux/api/newEventsApiSlice";
import { getStringParam } from "@/utils/routeParams";
import { formatDate } from "@/utils/formatDate";
import { needsOnline, needsVenue, stringifyTags } from "@/utils/newEventForm";

export default function OrganizerEventPreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const { data, isLoading, isFetching } = useGetNewEventQuery(eventId, {
    skip: !eventId,
  });
  const event = data?.body || {};
  const sessions = Array.isArray(event.sessions) ? event.sessions : [];
  const tickets = Array.isArray(event.tickets) ? event.tickets : [];
  const faqs = Array.isArray(event.faqs) ? event.faqs : [];
  const tags = stringifyTags(event.tags);
  const attendanceMode = event.attendance_mode || "VENUE";

  const handleShare = async () => {
    await Share.share({
      message: `Explore ${event.title || "this event"} on GatherPlus`,
    });
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Event preview"
      subtitle={event?.title || "Organizer workspace"}
      stats={[
        { label: "Sessions", value: sessions.length },
        { label: "Tickets", value: tickets.length },
        { label: "Status", value: event?.published ? "Live" : "Draft" },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mb-4">
        <Image
          source={{
            uri:
              event?.images?.[0] ||
              "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
          }}
          className="w-full h-56 bg-[#243044]"
        />
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-2xl font-semibold">
                {event?.title || "Untitled event"}
              </Text>
              <Text className="text-gray-300 mt-2 leading-6">
                {event?.summary || "No summary added yet."}
              </Text>
            </View>
            <View className={`px-3 py-2 rounded-full ${event.published ? "bg-primary/20" : "bg-[#8B6BFF]/20"}`}>
              <Text className={event.published ? "text-primary text-xs font-bold" : "text-[#A993FF] text-xs font-bold"}>
                {event.published ? "LIVE" : "DRAFT"}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-4">
            <ActionButton
              icon={<Edit3 color="#020e1e" size={16} />}
              label="Edit"
              primary
              onPress={() => router.push({ pathname: "/create", params: { eventId: String(event.id || eventId) } })}
            />
            <ActionButton
              icon={<Users color="#E5E7EB" size={16} />}
              label="Participants"
              onPress={() => router.push(`/profile/events/${eventId}/participants`)}
            />
            <ActionButton
              icon={<ScanLine color="#E5E7EB" size={16} />}
              label="Check-in"
              onPress={() => router.push(`/profile/events/${eventId}/check-in` as any)}
            />
            <ActionButton
              icon={<Radar color="#E5E7EB" size={16} />}
              label="Command"
              onPress={() => router.push(`/profile/events/${eventId}/command-center` as any)}
            />
            <ActionButton
              icon={<MessageSquare color="#E5E7EB" size={16} />}
              label="Engagement"
              onPress={() => router.push(`/profile/events/${eventId}/engagement-hub` as any)}
            />
            <ActionButton
              icon={<FileQuestion color="#E5E7EB" size={16} />}
              label="Responses"
              onPress={() => router.push(`/profile/events/${eventId}/questionnaire-responses`)}
            />
            <ActionButton
              icon={<Share2 color="#E5E7EB" size={16} />}
              label="Share"
              onPress={handleShare}
            />
          </View>
        </View>
      </View>

      <Section title="About the event">
        <Text className="text-gray-300 leading-6">
          {event?.description || "No event description added yet."}
        </Text>
        {!!tags && (
          <View className="flex-row items-start mt-4">
            <Tag color="#8B6BFF" size={18} />
            <Text className="text-gray-300 ml-2 flex-1">
              {tags.split(",").map((tag) => `#${tag.trim()}`).join("  ")}
            </Text>
          </View>
        )}
      </Section>

      {(needsOnline(attendanceMode) || needsVenue(attendanceMode)) && (
        <Section title="Access and location">
          {needsOnline(attendanceMode) && (
            <InfoRow
              icon={<Video color="#8B6BFF" size={18} />}
              label={`${event.online_platform || "Online event"} · ${event.online_url_reveal || "AFTER_BOOKING"}`}
              value={event.online_access_instructions || "Online access instructions will be shown after booking."}
            />
          )}
          {needsVenue(attendanceMode) && (
            <InfoRow
              icon={<MapPin color="#8B6BFF" size={18} />}
              label={event.address || "Venue address needed"}
              value={`${event.city || "City needed"} · ${event.country_code || "Country needed"}`}
            />
          )}
        </Section>
      )}

      <Section title="Sessions">
        {sessions.length ? (
          sessions.map((session: any, index: number) => (
            <View key={session.id || index} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
              <InfoRow
                icon={<Calendar color="#8B6BFF" size={18} />}
                label={session.name || `Session ${index + 1}`}
                value={`${formatDate(session.date)} · ${session.start_time || "Start"} - ${session.end_time || "End"}`}
              />
              {Array.isArray(session.participants) && session.participants.length ? (
                <View className="mt-3">
                  {session.participants.map((participant: any, participantIndex: number) => (
                    <Text key={`${participant.name}-${participantIndex}`} className="text-gray-400 mb-1">
                      {participant.name || "Presenter"} {participant.title ? `· ${participant.title}` : ""}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text className="text-gray-400">No sessions added yet.</Text>
        )}
      </Section>

      <Section title="Tickets">
        {tickets.length ? (
          tickets.map((ticket: any, index: number) => (
            <View key={ticket.id || index} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
              <InfoRow
                icon={<Ticket color="#8B6BFF" size={18} />}
                label={ticket.name || `Ticket ${index + 1}`}
                value={`${event.is_free ? "Free" : `${event.currency || ""} ${ticket.price || 0}`} · ${ticket.quantity || 0} available`}
              />
            </View>
          ))
        ) : (
          <Text className="text-gray-400">No tickets added yet.</Text>
        )}
      </Section>

      {(event.door_time || event.parking_info || event.agenda_info || event.discount_info) && (
        <Section title="Logistics">
          {[
            ["Door time", event.door_time],
            ["Parking", event.parking_info],
            ["Agenda", event.agenda_info],
            ["Lineup / extra info", event.discount_info],
          ]
            .filter(([, value]) => Boolean(value))
            .map(([label, value]) => (
              <InfoRow
                key={label}
                icon={<Clock color="#8B6BFF" size={18} />}
                label={String(label)}
                value={String(value)}
              />
            ))}
        </Section>
      )}

      {faqs.length ? (
        <Section title="FAQs">
          {faqs.map((faq: any, index: number) => (
            <View key={faq.id || index} className="border-b border-[#243044] pb-3 mb-3">
              <Text className="text-white font-semibold">{faq.question}</Text>
              <Text className="text-gray-400 mt-2 leading-6">{faq.answer}</Text>
            </View>
          ))}
        </Section>
      ) : null}
    </ProfileFoundationScreen>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
      <Text className="text-white text-xl font-semibold mb-3">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start mb-3">
      <View className="mt-1">{icon}</View>
      <View className="ml-3 flex-1">
        <Text className="text-white font-semibold">{label}</Text>
        <Text className="text-gray-400 mt-1 leading-6">{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`rounded-xl px-3 py-3 flex-row items-center ${
        primary ? "bg-primary" : "bg-[#1A2432] border border-[#2E3A4D]"
      }`}
      onPress={onPress}
    >
      {icon}
      <Text className={primary ? "text-background font-bold ml-2" : "text-white font-semibold ml-2"}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
