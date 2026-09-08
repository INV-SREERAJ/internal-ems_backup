import { useState } from "react";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";

/**
 * Reusable PasswordInput Component with Password Peek (Show / Hide) Toggle
 */
export default function PasswordInput({
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  className = "ems-login-input",
  style = {},
}) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((current) => !current);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={className}
        style={{
          paddingRight: "40px",
          ...style,
        }}
      />
      <button
        type="button"
        onClick={toggleShowPassword}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: "10px",
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          borderRadius: "4px",
          lineHeight: 1,
        }}
      >
        {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
      </button>
    </div>
  );
}
