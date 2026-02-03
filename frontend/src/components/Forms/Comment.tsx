import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    userId: string;
    user?: {
      name: string;
      email: string;
    };
    createdAt: string;
  };
  resourceType: string;
  resourceId: string;
  currentUserId?: string;
}

export default function Comment({
  comment,
  resourceType,
  resourceId,
  currentUserId,
}: CommentProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/comments/${comment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', resourceType, resourceId] });
    },
  });

  const isOwner = currentUserId === comment.userId;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-2">
            {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-sm">{comment.user?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                // Save logic here
                setIsEditing(false);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditContent(comment.content);
                setIsEditing(false);
              }}
              className="px-3 py-1 border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      )}
    </div>
  );
}
