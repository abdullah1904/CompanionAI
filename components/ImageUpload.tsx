"use client"

import { useEffect, useState } from "react"
import { CldUploadButton } from "next-cloudinary"
import Image from "next/image"

type Props = {
    value: string
    disabled: boolean
    onChange: (src: string) => void
}

type Result = {
    info: {
        secure_url: string
    }
}

const ImageUpload = ({ onChange, value }: Props) => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, []);
    if (!isMounted) {
        return null;
    }
    return (
        <div className="space-y-4 w-full flex flex-col justify-center items-center">
            <CldUploadButton
                onSuccess={(result: unknown) => onChange((result as Result).info.secure_url)}
                options={{
                    maxFiles: 1,
                }}
                uploadPreset="befy0dgh"
            >
                <div className="p-4 border-4 border-dashed border-primary/10 rounded-lg hover:opacity-75 transition flex flex-col space-y-2 items-center justify-center">
                    <div className="relative h-40 w-40">
                        <Image fill alt="Upload" src={value || "/placeholder.svg"} className="rounded-lg object-cover" />
                    </div>
                </div>
            </CldUploadButton>
        </div>
    )
}

export default ImageUpload