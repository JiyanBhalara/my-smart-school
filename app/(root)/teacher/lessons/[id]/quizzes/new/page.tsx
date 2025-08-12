import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import { redirect } from 'next/navigation';
import QuizForm from '@/components/QuizForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateQuizPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login');
  }

  const { id: lessonId } = await params;

  return (
    <div className="container mx-auto py-6">
      <QuizForm lessonId={lessonId} isEdit={false} />
    </div>
  );
}

