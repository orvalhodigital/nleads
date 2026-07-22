import React, { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { ticketService } from '../services/ticketService';

/**
 * Link de anexo de ticket. O valor guardado é um PATH no bucket privado
 * `support_attachments` (A43); resolvemos para uma URL assinada de curta duração
 * na montagem. Valores http legados passam direto.
 */
export const AttachmentChip: React.FC<{ value: string; index: number; className: string }> = ({ value, index, className }) => {
    const [href, setHref] = useState<string>('#');

    useEffect(() => {
        let alive = true;
        ticketService.getAttachmentUrl(value).then(url => { if (alive) setHref(url); });
        return () => { alive = false; };
    }, [value]);

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={e => { if (href === '#') e.preventDefault(); }}
            className={className}
        >
            <Paperclip size={12} /> Anexo {index + 1}
        </a>
    );
};

export default AttachmentChip;
