'use client';
import { useState, useEffect } from 'react';
import { downloadPDFSelected, startPDFGenerationSelected, createPDFDownloadToken } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const PDFDownloadButton = ({ studentId, selectedReports = [], onDownloadStart, onDownloadEnd, children, className = '', academicYear = null }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Pre-warm: silently kick off PDF generation when the button mounts so the
  // PDF is cached (or nearly ready) by the time the user clicks download.
  useEffect(() => {
    if (!studentId) return;
    const prewarm = async () => {
      try {
        const data = JSON.stringify({
          reports:
            selectedReports && selectedReports.length > 0
              ? selectedReports
              : ['dental', 'eye', 'physical', 'emotional', 'nutrition', 'lab'],
        });
        await startPDFGenerationSelected(parseInt(studentId), data, academicYear);
      } catch {
        // Silent fail — pre-warm is best-effort only
      }
    };
    prewarm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, academicYear]);

  const pollPDFStatus = async (queryParameter) => {
    // Poll up to 5 minutes: first 10 polls every 3s, then every 5s after that
    const FAST_INTERVAL = 3000;   // 3s for first 10 attempts
    const SLOW_INTERVAL = 5000;   // 5s after that
    const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minute hard cap
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let attempt = 0;
      const poll = async () => {
        attempt++;
        const elapsed = Date.now() - startTime;

        if (elapsed >= MAX_WAIT_MS) {
          reject(new Error('PDF generation timeout. Please try again.'));
          toastMessage('PDF generation timeout. Please try again.', 'error');
          return;
        }

        const remainingSeconds = Math.ceil((MAX_WAIT_MS - elapsed) / 1000);
        setEstimatedTime(remainingSeconds);

        try {
          const response = await downloadPDFSelected(parseInt(studentId), queryParameter, academicYear);
          const data = JSON.parse(response);

          if (data.status === true && data.download) {
            resolve(data.download);
          } else if (data.status === 'error') {
            // Background generation failed — stop polling immediately
            // Sanitize raw Python/server errors so users see a friendly message
            const rawMsg = data.message || '';
            const isInternalError = rawMsg.includes('has no attribute') || rawMsg.includes('Traceback') || rawMsg.includes('TypeError') || rawMsg.includes('Exception') || rawMsg.includes('Error:');
            const userMsg = isInternalError ? 'PDF generation failed. Please try again later.' : (rawMsg || 'PDF generation failed. Please try again.');
            reject(new Error(userMsg));
          } else {
            const interval = attempt <= 10 ? FAST_INTERVAL : SLOW_INTERVAL;
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

      // Extract key + academic_year from the backend-provided URL.
      const urlObj = new URL(url);
      const key = urlObj.searchParams.get('key');
      const academicYear = urlObj.searchParams.get('academic_year');

      // Get a short-lived one-time token (server action handles auth).
      const token = await createPDFDownloadToken(studentId, key, academicYear);

      // Build the download URL from NEXT_PUBLIC_API_URL instead of using the
      // backend-provided URL directly — the backend URL has a doubled /api/v1/
      // prefix when behind a reverse proxy, which causes a 404.
      const baseApiUrl = process.env.NEXT_PUBLIC_API_URL;
      const params = new URLSearchParams({
        key,
        academic_year: academicYear || '',
        direct: 'true',
        download_token: token,
      });
      const directUrl = `${baseApiUrl}/report/${studentId}/download-selected?${params.toString()}`;

      const link = document.createElement('a');
      link.href = directUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  };

  const handleSaveAsPDF = async () => {
    setIsDownloading(true);
    setDownloadProgress('checking');
    setEstimatedTime(300);

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
          const downloadUrl = await pollPDFStatus(queryParameter);
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
