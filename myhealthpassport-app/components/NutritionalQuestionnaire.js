import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  nutritionalQuestions,
  updateStudentNutritionalQuestionnaire,
  nutritionalQuestionsTeacher,
  updateTeacherNutritionalQuestionnaire,
} from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import nookies from 'nookies';
import InlineSpinner from '@/components/UI/InlineSpinner';

export default function NutritionalQuestionnaire() {
  const router = useRouter();
  const cookies = nookies.get();
  const { childId, id } = useParams();
  const [results, setResults] = useState({});
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const recordId = childId ? childId : id;
    setStudentId(recordId);
    async function GetDetails() {
      try {
        const rawResponse = cookies.root === 'teacher' ? await nutritionalQuestionsTeacher(recordId) : await nutritionalQuestions(recordId);
        const result = JSON.parse(rawResponse);
        // console.log('nutritionalQuestions Response: ', result);
        setResults(result);
        // Initialize form data with existing answers
        if (result.status === true && result.data && result.data.questions) {
          const initialFormData = {};
          result.data.questions.forEach(question => {
            if (question.answer) {
              initialFormData[question.question_id] = question.answer;
            }
          });
          setFormData(initialFormData);
        }
      } catch (err) {
        toastMessage(err.message || `Failed to fetch data: ${rawResponse}`, 'error');
      } finally {
        setLoading(false);
      }
    }
    GetDetails();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const notes = e.target.notes.value;
    setNotes(notes);
    const apiFunction = cookies?.root === 'teacher' ? updateTeacherNutritionalQuestionnaire : updateStudentNutritionalQuestionnaire;
    const answers = Object.entries(formData).map(([question_id, answer]) => ({
      student_id: parseInt(studentId),
      question_id: parseInt(question_id),
      answer: answer,
    }));

    let payload = {
      answers: answers,
      notes: notes,
    };

    try {
      const request = await apiFunction(JSON.stringify(payload));
      if (request.status === true) {
        toastMessage(request.message, 'success');
      } else {
        toastMessage(request.message || 'Failed to update questionnaire', 'error');
      }
    } catch (err) {
      // console.log(err);
      toastMessage(err, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      <form method="PUT" onSubmit={handleSubmit}>
        <div className="border-b border-gray-900/10 pb-[30px]">
          {/* <h2 className="text-base/7 font-semibold text-[#000000] mb-[30px]">Nutrition Questionnaire</h2> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-[20px] gap-y-[40px] sm:gap-x-[25px] sm:gap-y-[50px] md:gap-x-[25px] md:gap-y-[50px] lg:gap-x-[30px] lg:gap-y-[70px]">
            {results.status === true ? (
              results.data?.questions.length > 0 ? (
                results.data.questions.map((questionItem, index) => (
                  <div key={index} className="flex flex-col">
                    <p className="font-inter font-normal text-sm leading-6 tracking-normal text-[#000000]">
                      {index + 1}. {questionItem.question_text}
                    </p>
                    <div className="mt-[15px] flex items-center space-x-5">
                      <div className="flex items-center space-x-[18px]">
                        <input
                          id={`${questionItem.question_id}-yes`}
                          name={questionItem.question_id.toString()}
                          value="Yes"
                          type="radio"
                          checked={formData[questionItem.question_id] === 'Yes'}
                          onChange={handleChange}
                          className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                        />
                        <label htmlFor={`${questionItem.question_id}-yes`} className="ml-3 block text-sm font-medium text-gray-900">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id={`${questionItem.question_id}-no`}
                          name={questionItem.question_id.toString()}
                          value="No"
                          type="radio"
                          checked={formData[questionItem.question_id] === 'No'}
                          onChange={handleChange}
                          className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                        />
                        <label htmlFor={`${questionItem.question_id}-no`} className="ml-3 block text-sm font-medium text-gray-900">
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-sm/6 text-center font-normal text-gray-500">No questions available</div>
              )
            ) : (
              <div className="col-span-full text-sm/6 text-center font-normal text-gray-500">{results.message || 'Failed to load questions'}</div>
            )}
          </div>
        </div>
        <div className="mt-[50px] border-b border-gray-900/10 pb-[30px]">
          <label htmlFor="Notes" className="block text-sm/6 font-semibold text-gray-900">
            Notes
          </label>
          <div className="mt-2 p-5">
            <textarea
              id="notes"
              name="notes"
              placeholder="Add notes here"
              rows={4}
              defaultValue={notes ? notes : results.data?.notes}
              style={{ width: '80%' }}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button
            type="button"
            className="font-normal w-[78px] h-[37px] py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap"
            onClick={() => router.back()}
          >
            Close
          </button>
          <button
            type="submit"
            className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
