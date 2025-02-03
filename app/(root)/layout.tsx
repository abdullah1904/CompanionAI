import Navbar from '@/components/Navbar'
import React from 'react'

type Props = {
    children: React.ReactNode
}

const RootLayout = ({ children }: Props) => {
    return (
        <div className='h-full'>
            <Navbar/>
            <main className='md:pl-20 pt-16 h-full'>
                {children}
            </main>
        </div>
    )
}

export default RootLayout