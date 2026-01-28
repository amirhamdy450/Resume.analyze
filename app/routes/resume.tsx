import React, {  useEffect , useState } from 'react'
import { useParams } from 'react-router'
import {Link, useNavigate} from "react-router";
import { usePuterStore } from '~/lib/puter';

import Summary from '~/components/Summary';
import Details from '~/components/Details';
import ATS from '~/components/ATS';



export const meta = () => ([
    { title: 'Resume.io | Review' },
    { name: 'description', content: 'Detailed overview of your resume' },
])
const Resume = () => {

 const {auth , isLoading, fs , kv} = usePuterStore();
 const {id} = useParams();
 const [imageUrl , setImageUrl] = useState('');
 const [resumeUrl , setResumeUrl] = useState('');
 const [feedback ,setFeedback] = useState<Feedback | null>(null);
 const [loadingError, setLoadingError] = useState<string | null>(null);

 const navigate = useNavigate();

   useEffect(() => {
        if(!auth.isAuthenticated && !isLoading) navigate(`/auth?next=resume/${id}`);
    }, [auth.isAuthenticated, isLoading])

    useEffect(() => {
        const loadResume = async () => {
            try {
                console.log('Loading resume with ID:', id);

                const resume = await kv.get(`resume:${id}`);
                console.log('Resume data from KV:', resume);

                if(!resume) {
                    console.error('No resume found with ID:', id);
                    setLoadingError('Resume not found');
                    return;
                }

                const data = JSON.parse(resume as string);
                console.log('Parsed resume data:', data);

                const resumeBlob = await fs.read(data.resumePath);
                console.log('Resume blob loaded:', !!resumeBlob);

                if(!resumeBlob) {
                    console.error('Failed to load resume file from:', data.resumePath);
                    setLoadingError('Failed to load resume file');
                    return;
                }

                const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                const resumeUrl = URL.createObjectURL(pdfBlob);
                setResumeUrl(resumeUrl);

                const imageBlob = await fs.read(data.imagePath);
                console.log('Image blob loaded:', !!imageBlob);

                if(!imageBlob) {
                    console.error('Failed to load image file from:', data.imagePath);
                    setLoadingError('Failed to load resume image');
                    return;
                }

                const imageUrl = URL.createObjectURL(new Blob([imageBlob], { type: 'image/png' }));
                setImageUrl(imageUrl);

                console.log('Feedback data:', data.feedback);
                setFeedback(data.feedback);

            } catch (error) {
                console.error('Error loading resume:', error);
                setLoadingError(error instanceof Error ? error.message : 'Failed to load resume');
            }
        }

        loadResume();
    }, [id]);


  return (
    <main className="!pt-0">
        <nav className="resume-nav">
            <Link to="/" className="back-button">
                <img src="/icons/back.svg" alt="logo" className='w-2.5 h-2.5' />
                <span className='text-gray-800 text-sm font-semibold'> Back to Homepage</span>
            </Link>
        </nav>
        <div className="flex flex-row w-full max-lg:flex-col-reverse">
            <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                {imageUrl && resumeUrl && (
                    <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit'>
                        <a  href={resumeUrl} target='_blank' rel='noreferrer noopenner'>
                            <img src={imageUrl} alt="" className='w-full h-full object-contain rounded-2xl' title='resume' />
                        </a>
                    </div>
                )}
            </section>

            <section className="feedback-section">
                <h2 className='text-4xl !text-black font-bold'>Resume Review</h2>
                {loadingError ? (
                    <div className='flex flex-col items-center gap-4 p-8'>
                        <p className='text-red-600 text-xl font-semibold'>{loadingError}</p>
                        <Link to="/" className="primary-button w-fit">
                            Back to Home
                        </Link>
                    </div>
                ) : feedback ? (
                    <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>

                        Summary ATS Details
                        <Summary feedback={feedback}/>
                        <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []}/>
                        <Details feedback={feedback}/>
                    </div>

                 ): (
                    <img src="/images/resume-scan-2.gif" alt=""  className='w-full'/>
                 )}



            </section>
        </div>
    </main>
  )
}

export default Resume