const LoadingSpinner = ({ size = 'md', text = '' }) => (
  <div className="spinner-wrapper">
    <div className={`spinner spinner-${size}`}></div>
    {text && <p className="spinner-text">{text}</p>}
  </div>
);

export default LoadingSpinner;
