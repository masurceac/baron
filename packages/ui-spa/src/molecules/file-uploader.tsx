import {
  FileAccessEnum,
  FileTypeEnum,
  FileValueType,
} from '@baron/file-upload/core';
import {
  useFileUpload,
  useFileUploadContext,
} from '@baron/file-upload/react';
import { Button } from '@baron/ui/button';
import { FileIcon } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { FileInput } from '@baron/ui/file-input';
import { useState } from 'react';

export function FileUploader(props: {
  accessType?: FileAccessEnum;
  allowedExtensions: FileTypeEnum[];
  disabled?: boolean;
  onChange(value: FileValueType): void;
  onDelete?(value: FileValueType): void;
  value?: FileValueType | null;
  maxSizeKB?: number;
  hideInfo?: boolean;
}) {
  const { storageServiceUrl, getFileUploadUrl } = useFileUploadContext();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  if (props.maxSizeKB !== undefined && props.maxSizeKB <= 0) {
    throw new Error('maxSizeKB must be a positive number');
  }

  const maxSizeAllowed = props.maxSizeKB ?? 10_000;

  const upload = useFileUpload({
    onChange(value) {
      setError(null);
      props.onChange(value);
    },
    getFileUploadUrl: async ({ accessType }) => {
      return `${storageServiceUrl}${await getFileUploadUrl({ accessType })}`;
    },
    onError({ message }) {
      setError(message);
    },
    allowedExtensions: props.allowedExtensions,
    maxSizeKB: maxSizeAllowed,
    accessType: props.accessType ?? FileAccessEnum.PRIVATE,
    resetAfterUpload: true,
  });
  return (
    <div className="w-full flex flex-col space-y-2">
      <Button
        asChild
        size="sm"
        variant="outline"
        type="button"
        className="justify-between cursor-pointer"
        disabled={props.disabled}
      >
        <label
          htmlFor={upload.inputProps.id}
          className="group-data-[success=true]:text-green-theme"
        >
          {props.value ? props.value.name : t('Upload file')}
          <FileIcon className="w-4" />
        </label>
      </Button>
      <FileInput
        className="hidden"
        disabled={props.disabled}
        {...upload.inputProps}
      />
      {error ? (
        <p className="text-xs font-medium text-red-theme">{error}</p>
      ) : !props.hideInfo ? (
        <p className="text-xs font-medium">
          <Trans
            i18nKey="Supported file types are {{ typesAllowed }}. The maximum file size allowed is {{ maxSizeAllowed }} Mb"
            values={{
              typesAllowed: props.allowedExtensions.join(', '),
              maxSizeAllowed: maxSizeAllowed / 1_000,
            }}
          />
        </p>
      ) : null}
    </div>
  );
}
