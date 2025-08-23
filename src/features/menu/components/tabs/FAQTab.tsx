'use client';

import { Button } from '@/components/ui/button';
import { MenuFormData } from '@/types/menu';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from '../FormInput';

interface FAQTabProps {
    form: UseFormReturn<MenuFormData>;
}

export function FAQTab({ form }: FAQTabProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'faqs',
    });

    return (
        <div className="p-6">
            <div className="mb-6">
                <Button
                    type="button"
                    onClick={() =>
                        append({
                            id: `faq-${Date.now()}`,
                            question: '',
                            answer: '',
                        })
                    }
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                </Button>
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-16 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-indigo-800 mb-2">
                        No FAQs Added
                    </h3>
                    <p className="text-indigo-600 mb-4">
                        Start by adding your first FAQ.
                    </p>
                    <Button
                        type="button"
                        onClick={() =>
                            append({
                                id: `faq-${Date.now()}`,
                                question: '',
                                answer: '',
                            })
                        }
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First FAQ
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-800">
                                    FAQ {index + 1}
                                </h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Question
                                    </label>
                                    <FormInput
                                        {...form.register(
                                            `faqs.${index}.question` as const,
                                            {
                                                required:
                                                    'Question is required',
                                            }
                                        )}
                                        placeholder="Enter FAQ question"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Answer
                                    </label>
                                    <FormTextarea
                                        {...form.register(
                                            `faqs.${index}.answer` as const,
                                            {
                                                required: 'Answer is required',
                                            }
                                        )}
                                        placeholder="Enter FAQ answer"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
