import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { MessageSquareIcon, HeartIcon, ChevronDownIcon, SendIcon } from 'lucide-react-native';
import { useGetCommentsQuery, useGetRepliesQuery, useCreateCommentMutation, useLikeCommentMutation } from '@/redux/api/eventsApiSlice';

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
}

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  eventId,
  userId,
  parentComment = null,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  
  // Fetch comments or replies based on whether it's a parent comment or reply
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = parentComment 
    ? useGetRepliesQuery({ event_id: eventId, parent_id: parentComment.id })
    : useGetCommentsQuery(eventId);
  
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [likeComment] = useLikeCommentMutation();
  
  const comments = commentsData?.body || [];
console.log(commentsData,"commentsData")
  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const payload = {
        content: commentText,
        ...(replyingTo ? { parent_id: replyingTo.id } : { event_id: eventId })
      };
      
      await createComment({ data: payload, user_id: userId }).unwrap();
      setCommentText('');
      setReplyingTo(null);
      refetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      await likeComment({ 
        data: { comment_id: commentId }, 
        user_id: userId 
      }).unwrap();
      refetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="p-4 border-b border-gray-200">
      <View className="flex-row items-start space-x-3">
        <View className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          {item.user.profile.image_url && (
            <Image 
              source={{ uri: item.user.profile.image_url }} 
              className="w-full h-full"
            />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-semibold">{item.user.profile.name}</Text>
          <Text className="text-gray-800 mt-1">{item.content}</Text>
          
          <View className="flex-row items-center mt-2 space-x-4">
            <TouchableOpacity 
              onPress={() => handleLikeComment(item.id)}
              className="flex-row items-center space-x-1"
            >
              <HeartIcon size={16} className="text-gray-500" />
              <Text className="text-gray-500 text-xs">
                {item._count.comment_like}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setReplyingTo(item);
                setIsReplying(true);
              }}
              className="flex-row items-center space-x-1"
            >
              <MessageSquareIcon size={16} className="text-gray-500" />
              <Text className="text-gray-500 text-xs">
                {item._count.replies}
              </Text>
            </TouchableOpacity>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            {/* Header */}
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <TouchableOpacity onPress={onClose}>
                <ChevronDownIcon size={24} className="text-gray-500" />
              </TouchableOpacity>
              <Text className="font-bold text-lg">
                {parentComment ? 'Replies' : 'Comments'}
              </Text>
              <View className="w-6" />
            </View>
            
            {/* Comments List */}
            {commentsLoading ? (
              <View className="flex-1 justify-center items-center p-8">
                <ActivityIndicator size="large" />
              </View>
            ) : commentsError ? (
              <View className="flex-1 justify-center items-center p-8">
                <Text className="text-red-500">Error loading comments</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.commentsContainer}
                ListEmptyComponent={
                  <View className="p-8 items-center">
                    <Text className="text-gray-500">No comments yet</Text>
                  </View>
                }
              />
            )}
            
            {/* Input Area */}
            <View className="p-4 border-t border-gray-200">
              {replyingTo && (
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm text-blue-500 mr-1">
                    Replying to {replyingTo.user.profile.name}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <Text className="text-sm text-gray-500">(cancel)</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View className="flex-row items-center space-x-2">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  onSubmitEditing={handleSendComment}
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  disabled={isCreating || !commentText.trim()}
                  className="bg-blue-500 p-2 rounded-full"
                >
                  {isCreating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <SendIcon size={20} className="text-white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  commentsContainer: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 60,
  },
});

export default CommentModal;