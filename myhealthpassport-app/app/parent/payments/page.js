import Header from '@/components/Header'
import { Suspense } from 'react'

const Payments = () => {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <div className="w-full">
                <Header />
                <div className='p-10'>This page is under progress</div>
            </div>
        </Suspense>
    )
}

export default Payments