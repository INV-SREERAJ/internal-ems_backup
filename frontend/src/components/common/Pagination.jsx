import MuiPagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

export default function Pagination({
  pageNumber,
  totalPages,
  onPageClick,
  onPageChange,
}) {
  if (totalPages === 0) return null;

  const handlePageChange = (val) => {
    if (onPageClick) onPageClick(val);
    if (onPageChange) onPageChange(val);
  };

  return (
    <div className="mt-5 flex items-center justify-center">
      <Stack spacing={2}>
        <MuiPagination 
          count={totalPages} 
          page={pageNumber} 
          onChange={(event, value) => handlePageChange(value)} 
          color="primary" 
          shape="rounded"
        />
      </Stack>
    </div>
  );
}
