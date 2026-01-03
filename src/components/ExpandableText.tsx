import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface ExpandableTextProps {
    text: string;
    limit?: number;
    className?: string;
}

export const ExpandableText = ({ text, limit = 150, className = "" }: ExpandableTextProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;
    if (text.length <= limit) return <p className={className}>{text}</p>;

    return (
        <div className={className}>
            <p className="inline">
                {isExpanded ? text : `${text.substring(0, limit)}...`}
            </p>
            <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-1 text-blue-600 font-semibold h-unset"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? "Read Less" : "Read More"}
            </Button>
        </div>
    );
};
