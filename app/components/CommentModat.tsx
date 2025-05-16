import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import {
  MessageSquareIcon,
  HeartIcon,
  ChevronDownIcon,
  SendIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XIcon,
} from "lucide-react-native";
import {
  useGetCommentsQuery,
  useGetRepliesQuery,
  useCreateCommentMutation,
  useLikeCommentMutation,
} from "@/redux/api/eventsApiSlice";

interface Comment {
  id: number;
  content: string;
  user_id: number;
  user: {
    profile: {
      image_url: string;
      name: string;
    };
  };
  _count: {
    comment_like: number;
    replies: number;
  };
  created_at: string;
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
  userId: string;
  parentComment?: Comment | null;
  level?: number;
  navigationTitle?: string;
}

const MAX_NESTING_LEVEL = 3;

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  eventId,
  userId,
  parentComment = null,
  level = 0,
  navigationTitle = "Comments",
}) => {
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [currentReplies, setCurrentReplies] = useState<Comment | null>(null);

  // Fetch comments or replies based on whether it's a parent comment or reply
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = currentReplies
    ? useGetRepliesQuery(
        { event_id: eventId, parent_id: currentReplies.id },
        {
          refetchOnMountOrArgChange: true,
          refetchOnFocus: true,
        }
      )
    : parentComment
    ? useGetRepliesQuery(
        { event_id: eventId, parent_id: parentComment.id },
        {
          refetchOnMountOrArgChange: true,
          refetchOnFocus: true,
        }
      )
    : useGetCommentsQuery(eventId);

  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [likeComment] = useLikeCommentMutation();

  const comments = commentsData?.body || [];

  const navigateToReplies = (comment: Comment) => {
    setCurrentReplies(comment);
  };

  const navigateBack = () => {
    if (currentReplies) {
      setCurrentReplies(null);
    } else if (level > 0) {
      onClose(); // Close this nested modal
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const payload = {
        content: commentText,
        ...(replyingTo ? { parent_id: replyingTo.id } : { event_id: eventId }),
      };

      await createComment({ data: payload, user_id: userId }).unwrap();
      setCommentText("");
      setReplyingTo(null);
      refetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      await likeComment({
        data: { comment_id: commentId },
        user_id: userId,
      }).unwrap();
      refetchComments();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className={`p-4 ${level > 0 ? "pl-6" : ""}`}>
      <View className="flex-row items-start space-x-3">
        <View className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
          {item.user.profile.image_url && (
            <Image
              source={{ uri: item.user.profile.image_url }}
              className="w-full h-full"
            />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-white">
            {item.user.profile.name}
          </Text>
          <Text className="text-gray-300 mt-1">{item.content}</Text>

          <View className="flex-row items-center mt-2 space-x-4">
            <TouchableOpacity
              onPress={() => handleLikeComment(item.id)}
              className="flex-row items-center p-1 space-x-1"
            >
              <HeartIcon size={16} className="text-primary" />
              <Text className="text-primary text-xs">
                {item._count.comment_like}
              </Text>
            </TouchableOpacity>

            {level < MAX_NESTING_LEVEL - 1 && (
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(item);
                }}
                className="flex-row p-1 items-center space-x-1"
              >
                <MessageSquareIcon size={16} className="text-primary" />
                <Text className="text-primary text-xs">Reply</Text>
              </TouchableOpacity>
            )}

            {item._count.replies > 0 && level < MAX_NESTING_LEVEL - 1 && (
              <TouchableOpacity
                onPress={() => navigateToReplies(item)}
                className="flex-row items-center space-x-1 p-1"
              >
                <Text className="text-primary text-xs">
                  {item._count.replies}{" "}
                  {item._count.replies === 1 ? "reply" : "replies"}
                </Text>
                <ChevronRightIcon size={16} className="text-primary" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(55, 53, 53, 0.74)" }}
        >
          <View
            className={`bg-background rounded-t-3xl ${
              level === 0 ? "max-h-[85%]" : "h-[85%]"
            }`}
          >
            {/* Header */}
            <View className="p-4 border-b border-gray-800 flex-row justify-between items-center">
              <TouchableOpacity onPress={navigateBack} className="p-1">
                {level > 0 || currentReplies ? (
                  <ChevronLeftIcon size={24} className="text-primary" />
                ) : (
                  <ChevronDownIcon size={24} className="text-background" />
                )}
              </TouchableOpacity>

              <Text className="font-bold text-lg text-white">
                {currentReplies
                  ? "Replies"
                  : level > 0
                  ? navigationTitle
                  : "Comments"}
              </Text>

              <TouchableOpacity onPress={onClose} className="p-1">
                <XIcon size={24} className="text-primary" />
              </TouchableOpacity>
            </View>

            {/* Current comment context when viewing replies */}
            {currentReplies && (
              <View className="p-4 border-b border-gray-800 bg-gray-900">
                <View className="flex-row items-start space-x-3">
                  <View className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                    {currentReplies.user.profile.image_url && (
                      <Image
                        source={{ uri: currentReplies.user.profile.image_url }}
                        className="w-full h-full"
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-white text-sm">
                      {currentReplies.user.profile.name}
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      {currentReplies.content}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <View className="flex-1 justify-center items-center p-8">
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : commentsError ? (
              <View className="flex-1 justify-center items-center p-8">
                <Text className="text-red-500">Error loading comments</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => `${item.id}-${level}`}
                contentContainerStyle={styles.commentsContainer}
                ListEmptyComponent={
                  <View className="p-8 items-center">
                    <Text className="text-gray-500">No comments yet</Text>
                  </View>
                }
              />
            )}

            {/* Input Area */}
            {level < MAX_NESTING_LEVEL - 1 && (
              <View className="p-4 border-t border-gray-800">
                {replyingTo && (
                  <View className="flex-row items-center mb-2">
                    <Text className="text-sm text-blue-400 mr-1">
                      Replying to {replyingTo.user.profile.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setReplyingTo(null)}
                      className="p-1"
                    >
                      <XIcon size={14} className="text-gray-500" />
                    </TouchableOpacity>
                  </View>
                )}

                <View className="flex-row items-center space-x-2">
                  <TextInput
                    className="flex-1 border border-gray-700 rounded-full px-4 py-2 bg-gray-800 text-white"
                    placeholder={
                      replyingTo ? "Write a reply..." : "Write a comment..."
                    }
                    placeholderTextColor="#6b7280"
                    value={commentText}
                    onChangeText={setCommentText}
                    onSubmitEditing={handleSendComment}
                  />
                  <TouchableOpacity
                    onPress={handleSendComment}
                    disabled={isCreating || !commentText.trim()}
                    className="bg-primary p-2 rounded-full"
                  >
                    {isCreating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <SendIcon size={20} className="text-white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  commentsContainer: {
    paddingBottom: Platform.OS === "ios" ? 80 : 60,
  },
});

export default CommentModal;
