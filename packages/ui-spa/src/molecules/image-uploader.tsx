import {
  FileAccessEnum,
  FileValueType,
  ImageFileTypeEnum,
} from '@baron/file-upload/core';
import {
  useFileUpload,
  useFileUploadContext,
} from '@baron/file-upload/react';
import { Button } from '@baron/ui/button';
import { Input } from '@baron/ui/input';
import { FileIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ShowImages } from './show-images';

export function ImageUploader(props: {
  value?: FileValueType | null;
  onChange(value: FileValueType): void;
  accessType?: FileAccessEnum;
  onDelete?(value: FileValueType): void;
  disabled?: boolean;
}) {
  const { storageServiceUrl, getFileUploadUrl } = useFileUploadContext();
  const { t } = useTranslation();
  const upload = useFileUpload({
    onChange(value) {
      props.onChange(value);
    },
    getFileUploadUrl: async ({ accessType }) => {
      return `${storageServiceUrl}${await getFileUploadUrl({ accessType })}`;
    },
    onError() {},
    allowedExtensions: Object.values(ImageFileTypeEnum),
    maxSizeKB: 10_000,
    accessType: props.accessType ?? FileAccessEnum.PUBLIC,
    resetAfterUpload: true,
  });
  return (
    <div className="w-full flex flex-col">
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
          {t('Upload file')}
          <FileIcon className="w-4" />
        </label>
      </Button>
      <Input
        className="hidden"
        disabled={props.disabled}
        {...upload.inputProps}
      />
      {props.value && (
        <ShowImages onDelete={props.onDelete} value={[props.value]} />
      )}
    </div>
  );
}
