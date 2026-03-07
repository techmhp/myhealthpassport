'use client';
import { useState } from 'react';
import { downloadPDFSelected, startPDFGenerationSelected } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const PDFDownloadButton = ({ studentId, selectedReports = [], onDownloadStart, onDownloadEnd, children, className = '', academicYear = null }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);

  const pollPDFStatus = async (maxAttempts = 30, interval = 3000, queryParameter) => {
    let attempts = 0;
    const maxTimeSeconds = Math.ceil((maxAttempts * interval) / 1000);

    return new Promise((resolve, reject) => {
      const poll = async () => {
        attempts++;

        if (attempts > maxAttempts) {
          reject(new Error('PDF generation timeout. Please try again.'));
          toastMessage('PDF generation timeout. Please try again.', 'error');
          return;
        }

        try {
          const elapsedTime = attempts * (interval / 1000);
          const remainingTime = Math.max(maxTimeSeconds - elapsedTime, 3);
          setEstimatedTime(Math.ceil(remainingTime));

          const response = await downloadPDFSelected(parseInt(studentId), queryParameter, academicYear);
          const data = JSON.parse(response);

          if (data.status === true && data.download) {
            resolve(data.download);
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  };

  const downloadPDFFromURL = async url => {
    try {
      setDownloadProgress('downloading');
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-report-${studentId}-${Date.now()}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      return true;
    } catch (error) {
      console.error('Error downloading PDF from URL:', error);
      throw error;
    }
  };

  const handleSaveAsPDF = async () => {
    setIsDownloading(true);
    setDownloadProgress('checking');
    setEstimatedTime(90);

    if (onDownloadStart) onDownloadStart();

    try {
      let data;
      if (selectedReports && selectedReports.length > 0) {
        data = JSON.stringify({
          reports: selectedReports,
        });
      } else {
        data = JSON.stringify({
          reports: ['dental', 'eye', 'physical', 'emotional', 'nutrition', 'lab'],
        });
      }
      const downloadData = await startPDFGenerationSelected(parseInt(studentId), data, academicYear);

      if (downloadData.status === true && downloadData.download) {
        await downloadPDFFromURL(downloadData.download);
        toastMessage('PDF downloaded successfully', 'success');
        setIsDownloading(false);
        if (onDownloadEnd) onDownloadEnd();
        return;
      }

      setDownloadProgress('generating');
      // let startResponse;
      // if (selectedReports && selectedReports.length > 0) {
      //   // Use new API for selected reports
      //   const data = JSON.stringify({
      //     reports: selectedReports,
      //   });
      //   console.log('selectedReports before Api call', data);
      //   startResponse = await startPDFGenerationSelected(parseInt(studentId), data);
      // } else {
      //   // Use original API for all reports
      //   const data = JSON.stringify({
      //     reports: ['dental', 'eye', 'physical', 'emotonal', 'nutrition', 'lab'],
      //   });
      //   startResponse = await startPDFGenerationSelected(parseInt(studentId), data);
      // }
      // const startResponse = await startPDFGenerationSelected(parseInt(studentId), data);
      // console.log('startResponse', startResponse);
      const startData = downloadData;
      // console.log('startData', startData);

      if (startData.status === 'error') {
        toastMessage(startData.message || 'Report is not fully completed', 'error');
        setIsDownloading(false);
        if (onDownloadEnd) onDownloadEnd();
        return;
      }

      const checkStatusUrl = downloadData?.check_status;
      const queryParameter = new URL(checkStatusUrl).searchParams.get('key');

      // if (startData.status === true && startData.download) {
      //   await downloadPDFFromURL(startData.download);
      //   toastMessage('PDF downloaded successfully', 'success');
      //   setIsDownloading(false);
      //   if (onDownloadEnd) onDownloadEnd();
      //   return;
      // }

      if (startData.status === false) {
        setDownloadProgress('generating');

        try {
          const downloadUrl = await pollPDFStatus(30, 3000, queryParameter);
          await downloadPDFFromURL(downloadUrl);
          toastMessage('PDF downloaded successfully', 'success');
        } catch (pollError) {
          console.error('Polling error:', pollError);

          if (pollError.message.includes('timeout')) {
            toastMessage('PDF generation is taking longer than expected. Please try again in a moment.', 'warning');
          } else {
            toastMessage(pollError.message || 'Failed to generate PDF', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error in PDF download process:', error);
      toastMessage(error.message || 'Failed to download PDF. Please try again.', 'error');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
      setEstimatedTime(0);
      if (onDownloadEnd) onDownloadEnd();
    }
  };

  const getProgressMessage = () => {
    switch (downloadProgress) {
      case 'checking':
        return 'Checking for existing PDF...';
      case 'generating':
        return `Generating your PDF report...(Est. ${estimatedTime}s remaining)`;
      case 'downloading':
        return 'Downloading your PDF...';
      default:
        return 'Processing...';
    }
  };

  return (
    <>
      {/* Download Button/Icon */}
      <div onClick={isDownloading ? null : handleSaveAsPDF} className={className}>
        {children}
      </div>

      {/* Loading Modal */}
      {isDownloading && (
        <div className="fixed inset-0 bg-transparent bg-opacity-60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="mb-6 relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {downloadProgress === 'checking' && 'Checking Status'}
                {downloadProgress === 'generating' && 'Generating PDF'}
                {downloadProgress === 'downloading' && 'Downloading'}
                {!downloadProgress && 'Processing'}
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">{getProgressMessage()}</p>
              <p className="text-xs text-gray-500 text-center mt-5">Please don't close this window</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PDFDownloadButton;
