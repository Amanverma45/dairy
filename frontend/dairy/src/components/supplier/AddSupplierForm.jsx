import { useState } from "react";

const AddSupplierForm = () => {

  const [formData, setFormData] = useState({
    supplierId: "SUP-001",
    name: "",
    mobile: "",
    village: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);
  };

  return (
    <div>

    </div>
  );
};

export default AddSupplierForm;