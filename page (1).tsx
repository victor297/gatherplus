'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FaHeart, FaComment, FaShareAlt } from 'react-icons/fa';
import CommentModal from '../CommentModal';
import EmailModal from '../modal/EmailModal';
import {
  useLazyGetOneUpcomingEventQuery,
  useNotifyUserAboutEventMutation,
  useLazyLikeEventQuery,
} from '@/services/slices/events.slice';
import { usePathname } from 'next/navigation';
import { EventProps } from '@/app/homepage/EventCard';
import { toast } from 'react-toastify';
import CountdownTimer from '../../components/CountdownTimer.component';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

export default function EventDetails() {
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  const userID = useSelector((state: RootState) => state.user.userDetails.id);

  const [eventData, setEventData] = useState<EventProps>({
    id: 0,
    images: [],
    category_id: 0,
    title: '',
    start_date: '',
    time: '',
    city: '',
    address: '',
    price: 0,
    likes: 0,
    description: '',
    tickets: [
      {
        id: 0,
        name: '',
        price: '',
        no_per_seat_type: '',
        seat_type: '',
        quantity: 0,
        totalSold: 0,
      },
    ],
    published: false,
    each_ticket_identity: false,
    reason: '',
    currency: '',
    sessions: [
      {
        id: 0,
        name: '',
        start_time: '',
        end_time: '',
      },
    ],
    user: {
      _count: {
        follower: 0,
      },
      profile: {
        name: '',
        image_url: '',
      },
    },
    category: {
      name: '',
    },
    _count: {
      eventLikes: 0,
    },
    venue: '',
    tags: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const [getUpcomingEventDetails] = useLazyGetOneUpcomingEventQuery();
  const [notifyUserAboutEvent] = useNotifyUserAboutEventMutation();
  const [likeEvent] = useLazyLikeEventQuery();

  useEffect(() => {
    const getEventData = async () => {
      const response = await getUpcomingEventDetails(id).unwrap();

      if (
        response &&
        response.code === 200 &&
        response.message === 'SUCCESSFUL' &&
        response.body
      ) {
        setEventData(response.body);
      } else {
        toast.error('Error getting Event details', {
          position: 'top-right',
        });
      }
    };

    getEventData();
  }, [getUpcomingEventDetails, id]);

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const eventId = e.currentTarget.value;
    try {
      await navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_APP_URL}upcoming-events/eventdetails/${eventId}`,
      );
      toast.success('Link Copied Successfully!', { position: 'top-right' });
      setShareLinkCopied(true);
    } catch {
      toast.error('Failed to copy link: ', { position: 'top-right' });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast.error('Please enter a valid email.', { position: 'top-right' });
      return;
    }

    try {
      const response = await notifyUserAboutEvent({
        email: email.trim(),
      }).unwrap();

      if (
        response?.code === 200 &&
        response?.body === 'Subscribed successfully'
      ) {
        toast.success('Reminder set successfully!', { position: 'top-right' });
        setEmail('');
      } else {
        toast.error('Failed to set reminder', {
          position: 'top-right',
        });
      }
    } catch {
      toast.error('An error occurred. Please try again.', {
        position: 'top-right',
      });
    }
  };

  const handleLike = async () => {
    if (userID !== 0 && eventData.id !== 0) {
      const response = await likeEvent({ event_id: eventData.id }).unwrap();

      if (response.code === 200 && response.message === 'SUCCESSFUL') {
        setEventData({
          ...eventData,
          _count: {
            ...eventData._count,
            eventLikes: eventData._count.eventLikes + 1,
          },
        });
        toast.success('Event liked successfully', {
          position: 'top-right',
        });
      } else {
        toast.error('Failed to like event', {
          position: 'top-right',
        });
      }
    } else {
      toast.error('Please login to like this event', {
        position: 'top-right',
      });
    }
  };

  return (
    <div
      className='bg-[#020e1e] min-h-screen py-10 relative pb-56'
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/dondkf6je/image/upload/f_auto,q_auto/v1/GatherPlux%20-%20Dev%20Images/qq7es0mu6cc7tkzlv1kl')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className='max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-24'>
        {/* Left Section - Scrollable */}
        <div className='lg:col-span-2 space-y-6'>
          <h1 className='text-2xl lg:text-3xl font-bold text-white'>
            {eventData.title} - Organized by {eventData.user.profile.name}
          </h1>
          <p className='text-gray-400 flex items-center'>📍 {eventData.city}</p>

          {/* Banner */}
          <div className='relative'>
            <Image
              src={eventData.images[0] || '/banner.png'}
              alt='Event Banner'
              width={800}
              height={400}
              className='w-full rounded-lg shadow-lg'
            />
          </div>

          {/* Social Icons Section */}
          <div className='flex items-center justify-between mt-4'>
            <h2 className='text-xl font-bold text-white'>{eventData.title}</h2>
            <div className='flex items-center gap-4'>
              <button
                type='button'
                onClick={handleLike}
                className='flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700'
              >
                <FaHeart className='text-gray-400' />
                <span>{eventData._count.eventLikes}</span>
              </button>
              <button
                type='button'
                onClick={() => setIsModalOpen(true)}
                className='flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700'
              >
                <FaComment className='text-gray-400' />
                <span>0</span>
              </button>
              <button
                type='button'
                value={eventData.id}
                onClick={handleShare}
                className='flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700'
              >
                <FaShareAlt className='text-gray-400' />
                {shareLinkCopied ? (
                  <span className='text-green'>Copied</span>
                ) : (
                  <span>Share</span>
                )}
              </button>
            </div>
          </div>

          {/* Hosted By */}
          <div className='mt-6'>
            <span className='text-gray-400'>Hosted by:</span>
            <div className='font-semibold text-white'>
              {eventData.user.profile.name}
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <button
                type='button'
                onClick={() => setIsEmailModalOpen(true)}
                className='px-4 py-1 text-sm rounded border border-primary-500 text-primary-500'
              >
                Contact
              </button>
              <button
                type='button'
                className='px-4 py-1 text-sm rounded bg-gray-600 text-white'
              >
                Follow
              </button>
            </div>
          </div>

          {/* Email Modal */}
          <EmailModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
          />

          {/* Tags Section */}
          <div className='mt-6'>
            <h3 className='text-lg font-semibold text-white mb-2'>Tags</h3>
            <div className='flex flex-wrap gap-3'>
              {[
                'Holiday Concert',
                'Live Performance',
                'Seasonal Event',
                'Family-Friendly',
                '#Christmas_Carols',
                '#Christmas_Spirit',
              ].map((tag) => (
                <span
                  key={tag}
                  className='border border-gray-500 text-gray-300 px-3 py-2 rounded-full text-sm'
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Fixed */}
        <div className='lg:sticky lg:top-24 lg:self-start'>
          <div className='space-y-6'>
            {/* Countdown */}
            <CountdownTimer startDate={eventData.start_date} />

            {/* Notification Modal */}
            <div className='bg-gray-800 p-6 rounded-lg'>
              <h3 className='text-white font-semibold text-lg'>
                Get Notified About This Event!
              </h3>
              <p className='text-gray-400 text-sm mt-2'>
                Don&apos;t miss out! Enter your email to receive a reminder when
                this event is near.
              </p>
              <input
                type='email'
                value={email}
                onChange={handleEmailChange}
                placeholder='Enter your email'
                className='w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none'
              />
              <button
                type='button'
                onClick={handleEmailSubmit}
                className='w-full mt-4 bg-primary-500 text-black px-4 py-2 rounded-lg font-semibold'
              >
                🔔 Set Reminder
              </button>
            </div>
          </div>
        </div>

        {/* Comment Modal */}
        <CommentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventID={eventData.id}
        />
      </div>
    </div>
  );
}
