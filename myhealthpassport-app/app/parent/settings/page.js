import { Suspense } from 'react'
import Header from '@/components/Header'

const Settings = () => {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <div className="w-full">
                <Header />
                <div className='p-10'>This page is under progress</div>
            </div>
        </Suspense>
    )
}

export default Settings