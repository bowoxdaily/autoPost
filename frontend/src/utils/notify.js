import toast from 'react-hot-toast';

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function notifySuccess(message) {
  toast.success(message);
}

export function notifyError(message) {
  toast.error(message);
}

export function notifyInfo(message) {
  toast(message);
}
