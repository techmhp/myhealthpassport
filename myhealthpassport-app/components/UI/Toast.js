import React from "react";
import { ToastContainer, toast } from 'react-toastify';

const ToastMessage = ({ message, type }) => {
    const notify_success = () => toast.success(message);
    const notify_error = () => toast.error(message);
    const notify_warn = () => toast.warn(message);

    React.useEffect(() => {
        if (type == 'success') {
            notify_success();
        } else if (type = 'error') {
            notify_error();
        } else if (type = 'warn') {
            notify_warn();
        }
    }, [])

    return (
        <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick={true}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
        />
    );
}
export default ToastMessage;