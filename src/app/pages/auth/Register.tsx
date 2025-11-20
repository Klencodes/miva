import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '../../../ui';
import { useToast } from '../../../core/hooks/useToast';
import { countries } from './countries';
import { authService } from '../../../core/services/auth';
import { useStore } from '../../../core/hooks/useStore';

interface RegisterForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  phone_code: string;
}

const Register: React.FC = () => {
    const phoneCodes = useMemo(() => countries.map((country: { flag: any; code: any; phone_code: any; }) => ({
    label: `${country.flag} ${country.code} | ${country.phone_code}`,
    value: country.phone_code
  })), []);
  const { setUser } = useStore();

  const initialFormData: RegisterForm = {
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    phone_code: phoneCodes[0].value || '',
  };
  const navigate = useNavigate();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterForm>(initialFormData);

  const handleInputChange = useCallback((field: keyof RegisterForm) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const isFormValid = useMemo(() => {
    const { email, password, first_name, last_name, phone_number, phone_code } = formData;
    return (
      !!email &&
      !!password &&
      !!first_name &&
      !!last_name &&
      !!phone_number &&
      !!phone_code &&
      password.length >= 6 &&
      /\S+@\S+\.\S+/.test(email)
    );
  }, [formData]);

  const onSubmit = useCallback(async () => {
  if(formData?.password.length < 6 ){
    show('Error', 'Password must be at least 6 characters', 'error');
    return;
  }
  if (!isFormValid) {
    show('Validation Error', 'Please fill all required fields correctly', 'info');
    return;
  }
  
  setLoading(true);
  
  try {
    const response: any = await authService.register(formData);
    if(response.success){
      setUser(response.results);
      setLoading(false);
      
      navigate('/account/verify', { 
        state: { email: formData.email } 
      });
      show(response.response || 'Success', response.message || 'Registration successful', 'success');    
    }
   } catch (err: any) {
    setLoading(false);
    const errorMessage = err.error?.message || err.message || 'Registration failed';
    show('Error', errorMessage, 'error');
  }
  // eslint-disable-next-line
}, [formData, isFormValid, setUser]); // Add setUser to dependencies

  const handleLogin = useCallback(() => {
    navigate('/account/login');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 card">
        <h2 className="text-3xl font-bold text-center text-text mb-8">Create your account</h2>

        <div className="">
          <div className="grid grid-cols-2 gap-x-4">
            <Input
              id="firstname"
              label="First Name"
              type="text"
              name="firstname"
              value={formData.first_name}
              onChange={handleInputChange('first_name')}
              placeholder="John"
              required={true}
            />

            <Input
              id="last_name"
              label="Last Name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange('last_name')}
              placeholder="Doe"
              required={true}
            />
          </div>

          <Input
            id="emailF"
            label="Email"
            type="email"
            name="emailF"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Enter your email"
            required={true}
          />

          <div className="flex gap-2">
            <div className="w-32">
              <Input
                id="code"
                label="Code"
                type="select"
                name="code"
                value={formData.phone_code}
                onChange={handleInputChange('phone_code')}
                selectOptions={phoneCodes}
                required={true}
              />
            </div>
            
            <div className="flex-1">
              <Input
                id="phonenumber"
                label="Phone Number"
                type="tel"
                name="phonenumber"
                value={formData.phone_number}
                onChange={handleInputChange('phone_number')}
                placeholder="987 654 321"
                required={true}
              />
            </div>
          </div>

          <Input
            id="password"
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            placeholder="Enter your password"
            required={true}
          />

          <Button
            onClick={onSubmit}
            fullWidth={true}
            disabled={loading}
            loading={loading}
          >
             {!loading && <i className="ri-user-add-line mr-2"></i>}
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>

        <div className="text-center text-text-light text-sm">
          Already have an account? 
          <Button 
            className='-ml-2'
            variant='link'
            onClick={handleLogin}
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;