export const getCurrentAcademicYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  if (month >= 5) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
};
