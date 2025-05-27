import { FileAccessEnum, FileValueType } from '@baron/file-upload/core';
import { useFileUploadContext } from '@baron/file-upload/react';
import { Button } from '@baron/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@baron/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@baron/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@baron/ui/tooltip';
import { LockIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@baron/ui/utils';

export function ImageSource(props: {
  image: FileValueType | string;
  className: string;
}) {
  const context = useFileUploadContext();

  if (typeof props.image === 'object') {
    return (
      <img
        className={props.className}
        src={context.getFileReadUrl(props.image)}
        alt={props.image.name}
      />
    );
  }
  return <img className={props.className} src={props.image} alt={'Image'} />;
}

export function ShowImages<T extends FileValueType | string>(props: {
  value: T[];
  onDelete?: (value: T) => void;
  size?: string;
}) {
  const { t } = useTranslation();
  const onDelete = props.onDelete;

  const [open, setOpen] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);

  function handleItemClick(index: number) {
    setScrollIndex(index);
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap [&>div]:m-4 -ml-4">
        {props.value.map((imageItem, index) => (
          <div
            key={typeof imageItem === 'object' ? imageItem.path : index}
            className="flex justify-start"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => handleItemClick(index)}
                className="border rounded-lg p-2 relative"
              >
                <ImageSource
                  image={imageItem}
                  className={cn('object-cover', props.size ?? 'size-24')}
                />
              </button>
              <div className="absolute right-1 bottom-1 flex items-end space-x-2">
                {onDelete && (
                  <Button
                    variant="destructiveOutline"
                    className="bg-dark"
                    type="button"
                    onClick={() => onDelete(imageItem)}
                    size="iconXs"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
                {typeof imageItem === 'object' &&
                  imageItem.accessType === FileAccessEnum.PRIVATE && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" size="iconXs">
                            <LockIcon className="size-4 " />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('This file is private')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DialogContent className="lg:max-w-screen-md">
        <div className="sr-only">
          <DialogTitle>{t('Image preview')}</DialogTitle>
          <DialogDescription>{t('Preview your image')}</DialogDescription>
        </div>
        <div className="px-8">
          <Carousel
            opts={{
              loop: true,
              startIndex: scrollIndex,
            }}
            className="w-full"
          >
            <CarouselContent>
              {props.value.map((imageItem, index) => (
                <CarouselItem
                  key={typeof imageItem === 'object' ? imageItem.path : index}
                >
                  <ImageSource
                    image={imageItem}
                    className="w-full h-full object-contain"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}
