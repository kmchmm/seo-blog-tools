import { ChangeEvent, DragEvent, FC, use, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { ToastContext } from '../context/ToastContext';
import { Button } from '../components/Button';

import { FaUpload } from 'react-icons/fa';

const IS_DEV = import.meta.env.MODE === 'development';

const API_URL = IS_DEV
  ? import.meta.env.VITE_LOCAL_EXIF_API_URL
  : import.meta.env.VITE_PROD_EXIF_API_URL;

const API_URL_WRITE = IS_DEV
  ? import.meta.env.VITE_LOCAL_EXIF_WRITE_API_URL
  : import.meta.env.VITE_PROD_EXIF_WRITE_API_URL;

const ACCEPTED_FILES = '.jpg,.jpeg,.png,.webp';

const IMAGE_WIDTHS = [1920, 650, 420, 0];

const FORM_DATA_HEADER = {
  'Content-Type': 'multipart/form-data',
};

const DOWNLOAD_HEADERS = {
  'Content-Type': 'multipart/form-data',
  Accept: 'application/json,image/webp,image/png,image/jpg,image/jpg',
};

// convert deg-min-secs to purely degrees (from node-exiftool in api)
const convertToDegrees = (rawCoords: string) => {
  if (rawCoords) {
    const coords = rawCoords.trim().toLowerCase();
    const degArr = rawCoords.split('deg');
    // const degValue = degArr[0].trim();
    const [degValue, minString] = degArr;
    const minArr = minString.split("'");
    const [minValue, secString] = minArr;
    const secArr = secString.split('"');
    const [secValue] = secArr;
    const isNegative = coords.endsWith('s') || coords.endsWith('w');

    return String(
      (Number(degValue) + Number(minValue) / 60 + Number(secValue) / 3600) *
        (isNegative ? -1 : 1)
    );
  }
  return '';
};

const getFilename = (filename: string) => {
  const filenameArray = filename.split('.');
  // remove extension, pop since extension will always be last segment with .
  filenameArray.pop();
  return filenameArray.join('.');
};

const isAccepted = (filename: string) => {
  const extensionsArr = ACCEPTED_FILES.split(',');
  return extensionsArr.some(extension => filename.endsWith(extension));
};

const handleDownload = (blob: Blob, filename: string) => {
  // handle Download
  const href = URL.createObjectURL(blob);

  // create "a" HTML element with href to file & click
  // trigger downloading
  const link = document.createElement('a');
  link.href = href;
  link.setAttribute('download', `${filename}`); //or any other extension
  document.body.appendChild(link);
  link.click();

  // clean up "a" element & remove ObjectURL
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

const trySanitize = (text: string) => {
  const elm = document.createElement('p');
  elm.textContent = text;
  return elm.innerHTML;
};

const GeoTagger: FC = () => {
  const [exifName, setEXIFName] = useState<string>('');
  const [exifDesc, setEXIFDesc] = useState<string>('');
  const [exifLatitude, setEXIFLatitude] = useState<string>('');
  const [exifLongitude, setEXIFLongitude] = useState<string>('');
  const [file, setFile] = useState<File>();
  const [optimize, setOptimize] = useState<boolean>(false);
  const [imgWidth, setImgWidth] = useState<number>(1920);
  const [originalWidth, setOriginalWidth] = useState<string>('');
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [quality, setQuality] = useState<number>(80);
  const [preview, setPreview] = useState<string>('');
  const fileSelectRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { showToast } = use(ToastContext);

  const clearAll = () => {
    setEXIFName('');
    setEXIFDesc('');
    setEXIFLatitude('');
    setEXIFLongitude('');
    setFile(undefined);
    if (preview) URL.revokeObjectURL(preview);
    setPreview('');
    setOriginalWidth('');
    setCustomWidth(0);
    if (fileSelectRef.current) {
      fileSelectRef.current.value = '';
    }
  };

  // needed to recreate file from blob
  // to circumvent `ERR_UPLOAD_FILE_CHANGED`
  // when resubmitting without changing file
  const memoizeFile = (file: File) => {
    // get blob
    const reader = new FileReader();
    reader.onload = () => {
      const blob = new Blob([new Uint8Array(reader.result as ArrayBuffer)], {
        type: file.type,
      });
      const myFile = new File([blob], file.name, {
        type: blob.type,
      });
      setFile(myFile);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (!target.files || !target.files.length) return;
    if (!isAccepted(target.files[0].name)) {
      showToast('File format not accepted...');
      return;
    }
    memoizeFile(target.files[0]);
  };

  const previewImg = async () => {
    if (!file) return;
    try {
      const response = await axios.post(
        `${API_URL_WRITE}`,
        {
          file,
          DocumentName: exifName,
          ImageDescription: exifDesc,
          GPSLatitude: exifLatitude,
          GPSLongitude: exifLongitude,
          GPSLatitudeRef: Number(exifLatitude) > 0 ? 'N' : 'S',
          GPSLongitudeRef: Number(exifLongitude) > 0 ? 'E' : 'W',
          optimize,
          imgWidth: (imgWidth > 0) ? imgWidth : customWidth,
          quality,
        },
        {
          headers: DOWNLOAD_HEADERS,
          responseType: 'blob',
        }
      );
      const urlCreator = window.URL || window.webkitURL;
      const imageUrl = urlCreator.createObjectURL(response.data);
      // always call revokeObjectURL to previous preview url
      URL.revokeObjectURL(preview);
      showToast('Preview added...');
      setPreview(imageUrl);
    } catch (err) {
      showToast('Preview failed...');
      console.error('Error during API call:', err);
    } finally {
    }
  };

  const optimizeAndDL = async () => {
    if (!file) return;
    try {
      const response = await axios.post(
        `${API_URL_WRITE}`,
        {
          file,
          DocumentName: exifName,
          ImageDescription: exifDesc,
          GPSLatitude: exifLatitude,
          GPSLongitude: exifLongitude,
          GPSLatitudeRef: Number(exifLatitude) > 0 ? 'N' : 'S',
          GPSLongitudeRef: Number(exifLongitude) > 0 ? 'E' : 'W',
          optimize,
          imgWidth: (imgWidth > 0) ? imgWidth : customWidth,
          quality,
        },
        {
          headers: DOWNLOAD_HEADERS,
          responseType: 'blob',
        }
      );

      handleDownload(
        response.data,
        optimize
          ? // if optimize is on, replace extension with webp
            `${getFilename(file.name)}.webp`
          : file.name
      );
    } catch (err) {
      showToast('Geotagging/image optimization failed...');
      console.error('Error during API call:', err);
    } finally {
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer?.files;

    if (droppedFiles && droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles);
      if (newFiles && newFiles[0] && isAccepted(newFiles[0].name)) {
        memoizeFile(newFiles[0]);
      } else {
        showToast('File format not accepted...');
      }
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const response = await axios.post(
        API_URL,
        {
          file: file,
        },
        {
          headers: FORM_DATA_HEADER,
        }
      );

      const data = response.data;
      setEXIFName(trySanitize(data.DocumentName));
      setEXIFDesc(trySanitize(data.ImageDescription));
      setEXIFLatitude(convertToDegrees(trySanitize(data.GPSLatitude)));
      setEXIFLongitude(convertToDegrees(trySanitize(data.GPSLongitude)));
      showToast(data.message);
    } catch (err) {
      showToast('Metadata extraction failed...');
      console.error('Error during API call:', err);
    } finally {
    }
  };

  useEffect(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview('');
    setOriginalWidth('');
    if (!file) {
      if (imgRef.current) imgRef.current.src = '';

      return;
    }
    uploadFile(file);

    // Encode the file using the FileReader API
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image;
      img.onload = function() {
          setOriginalWidth(String(img.width));
          setCustomWidth(img.width);
      };
      const dataURI = reader.result as string;
      img.src = dataURI;
      if (imgRef.current) imgRef.current.src = dataURI;
    };
    reader.readAsDataURL(file as File);
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, []);

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Geo Tagger</h1>
      <section className="w-1/2 mt-8">
        <Button
          className={clsx(
            'flex flex-col items-center justify-center h-15 w-full',
            'rounded-md border-dotted  cursor-pointer'
          )}
          onClick={() => {
            fileSelectRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={event => event.preventDefault()}>
          <FaUpload />
          Drop your JPG/PNG/WEBP file here or click to browse
        </Button>
        <input
          type="file"
          onChange={handleFileSelect}
          accept={ACCEPTED_FILES}
          ref={fileSelectRef}
          hidden
        />
        <label className="block text-center p-2">{file && file.name}</label>
      </section>
      <div className="flex w-full flex-1">
        <section className="flex flex-col flex-1 items-center self-end">
          <label>EXIF Document Name</label>
          <input
            type="text"
            value={exifName}
            onChange={e => setEXIFName(e.target.value)}
            placeholder="Keywords and Tags"
          />
          <label>EXIF Image Description</label>
          <input
            type="text"
            value={exifDesc}
            onChange={e => setEXIFDesc(e.target.value)}
            placeholder="Description/Alternative Text"
          />
        </section>
        <section className="flex flex-col flex-1 items-center">
          <div className="flex flex-col items-center mt-3">
            <label className="font-bold">Geotags</label>
            <label>Latitude</label>
            <input
              type="text"
              value={exifLatitude}
              onChange={e => setEXIFLatitude(e.target.value)}
              placeholder="Latitude"
            />
            <label>Longitude</label>
            <input
              type="text"
              value={exifLongitude}
              onChange={e => setEXIFLongitude(e.target.value)}
              placeholder="Longitude"
            />
          </div>
        </section>
      </div>
      <section>
        <p className="my-2 text-center">
          Original Width: {originalWidth}
        </p>        
        <div className="my-2">
          <input
            className="m-1 cursor-pointer"
            id="optimize"
            type="checkbox"
            checked={optimize}
            onChange={e => setOptimize(e.target.checked)}
          />
          <label className="cursor-pointer" htmlFor="optimize">
            Optimize to WebP
          </label>
        </div>
        <div>
          <label className="w-20 inline-block">Width</label>
          <select
            disabled={!optimize}
            value={imgWidth}
            onChange={e => setImgWidth(Number(e.target.value))}
            className={clsx(
              '!w-40 !rounded-r-none',
              !optimize ? 'cursor-not-allowed opacity-50 ' : ''
            )}>
            {IMAGE_WIDTHS.map(width => (
              <option value={width} key={width}>
                {width > 0 ? width : 'Custom'}
              </option>
            ))}
          </select>
          <input
            disabled={imgWidth !== 0 || !optimize}
            type="number"
            value={customWidth}
            step="5"
            min="20"
            onChange={e => setCustomWidth(Number(e.target.value))}
            className={clsx(
              '!w-35 !rounded-l-none',
              (imgWidth !== 0 || !optimize) ?
                'cursor-not-allowed opacity-50 ' : ''
            )}
          />
        </div>
        <div>
          <label className="w-20 inline-block">Quality</label>
          <input
            disabled={!optimize}
            type="number"
            value={quality}
            step="5"
            min="30"
            max="100"
            onChange={e => setQuality(Number(e.target.value))}
            className={!optimize ? 'cursor-not-allowed opacity-50' : ''}
          />
        </div>
      </section>
      <section className="flex flex-row gap-3 m-3">
        <Button disabled={!file} onClick={previewImg}>
          Preview
        </Button>
        <Button disabled={!file} onClick={optimizeAndDL}>
          Optimize and Download
        </Button>
        <Button onClick={clearAll}>Clear All</Button>
      </section>
      {file && (
        <>
          <label>Original Image</label>
          <img
            ref={imgRef}
            className="maxw-full h-auto justify-self-center"
            alt="Preview of Original Image"
          />
        </>
      )}
      {preview && (
        <>
          <p>Optimized Image</p>
          <img
            className="maxw-full h-auto justify-self-center"
            alt="Preview of Optimized Image"
            src={preview}
          />
        </>
      )}
    </div>
  );
};

export default GeoTagger;
