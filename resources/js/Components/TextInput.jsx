import { forwardRef, useEffect, useRef, useState } from 'react';

export default forwardRef(function TextInput({ type = 'text', className = '', isFocused = false, ...props }, ref) {
    const input = ref ? ref : useRef();
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && show ? 'text' : type;

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <div className="flex flex-col items-start w-full">
            <div className="relative w-full">
                <input
                    {...props}
                    type={inputType}
                    className={
                        'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ' +
                        (isPassword ? 'pr-16 ' : '') +
                        className
                    }
                    ref={input}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                        {show ? 'Hide' : 'Show'}
                    </button>
                )}
            </div>
        </div>
    );
});
