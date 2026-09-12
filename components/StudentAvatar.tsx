'use client';

import { useState } from 'react';
import Image from 'next/image';

interface StudentAvatarProps {
  student: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export default function StudentAvatar({ student }: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Helper function to get student initials for avatar
  const getStudentInitials = (name: string | null) => {
    if (!name) return "?";
    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Helper function to generate avatar background color based on name
  const getAvatarBgColor = (name: string | null) => {
    if (!name) return "bg-gray-500";
    const colors = ['bg-ink'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 h-10 w-10">
        {student.image && !imageError ? (
          <Image
            className="h-10 w-10 rounded-full object-cover border-2 border-rule"
            src={student.image}
            alt={student.name || "Student"}
            width={40}
            height={40}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`flex h-10 w-10 rounded-full items-center justify-center text-white font-bold text-sm ${getAvatarBgColor(student.name)} border-2 border-white`}>
            {getStudentInitials(student.name)}
          </div>
        )}
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-ink">
          {student.name || "Unnamed Student"}
        </div>
        <div className="text-sm text-graphite">{student.email}</div>
      </div>
    </div>
  );
}
