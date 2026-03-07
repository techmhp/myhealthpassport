import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { nutritionalQuestionsTeacher, developmentalQuestionsTeacher } from '@/services/secureApis';
import { toastMessage, isNumber } from '@/helpers/utilities';
import InlineSpinner from '../UI/InlineSpinner';

export default function NutritionalQuestionnaire() {
  const { studentId } = useParams();
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({});

  const getNutritionalQuestionnare = async studentId => {
    try {
      const rawResponse = await nutritionalQuestionsTeacher(studentId);
      const result = JSON.parse(rawResponse);
      setResults(result);
    } catch (err) {
      toastMessage(err.message || `Failed to fetch data: ${rawResponse}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDevelopmentalQuestionnare = async studentId => {
    try {
      const rawResponse = await developmentalQuestionsTeacher(studentId);
      const result = JSON.parse(rawResponse);
      if (result.status !== true) {
        toastMessage(result.message || `Failed to fetch data: ${rawResponse}`, 'error');
        return;
      }
      setResults(result);
    } catch (err) {
      toastMessage(err.message || `Failed to fetch data: ${rawResponse}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const base64User = localStorage.getItem('user_info');
    const user_info = JSON.parse(atob(base64User));
    setUserRole(user_info.user_role);
    switch (user_info.user_role) {
      case 'PSYCHOLOGIST':
        getDevelopmentalQuestionnare(studentId);
        break;
      case 'NUTRITIONIST':
        getNutritionalQuestionnare(studentId);
        break;
      default:
        break;
    }
  }, [studentId]);

  if (loading)
    return (
      <div className="w-full py-8">
        <InlineSpinner />
      </div>
    );

  const renderAnwser = (score_type, answer) => {
    if (score_type === 'Positive' && answer === '1') return 'Never';
    else if (score_type === 'Positive' && answer === '3') return 'Always';
    else if (score_type === 'Negative' && answer === '1') return 'Always';
    else if (score_type === 'Negative' && answer === '3') return 'Never';
    else if (answer === '2') return 'Sometimes';
    else return '';
  };

  const renderSection = userRole => {
    switch (userRole) {
      case 'NUTRITIONIST':
        return (
          <div className="border-b border-gray-900/10 pb-[30px]">
            <h2 className="text-base/7 font-semibold text-[#000000] mb-[30px]">Nutrition Questionnaire</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-[20px] gap-y-[40px] sm:gap-x-[25px] sm:gap-y-[50px] md:gap-x-[25px] md:gap-y-[50px] lg:gap-x-[30px] lg:gap-y-[70px]">
              {results.status === true ? (
                results.data.questions.length > 0 ? (
                  results.data.questions.map((question, index) => (
                    <div key={index} className="flex flex-col">
                      <p className="font-inter font-normal text-sm leading-6 tracking-normal text-[#000000]">{`${index + 1}. ${question.question_text}`}</p>
                      <p className="text-blue-500 text-medium font-semibold">Ans: {!isNumber(question.answer) ? question.answer : ''}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-red-500">{results.message || 'No questions available'}</div>
                )
              ) : (
                <div className="col-span-full text-center text-red-500">{results.message}</div>
              )}
            </div>
          </div>
        );
      case 'PSYCHOLOGIST':
        return (
          <div className="border-b border-gray-900/10 pb-[30px]">
            <h2 className="text-base/7 font-semibold text-[#000000] mb-[30px]">
              Developmental & Emotional Screening{' '}
              <span className="text-blue-500 text-medium font-semibold">
                (Score: {results?.data?.health_score_count ? results.data.health_score_count : 0})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-[20px] gap-y-[40px] sm:gap-x-[25px] sm:gap-y-[50px] md:gap-x-[25px] md:gap-y-[50px] lg:gap-x-[30px] lg:gap-y-[70px]">
              {results.status === true ? (
                results.data?.questions.length > 0 ? (
                  results.data.questions.map((question, index) => (
                    <div key={index} className="flex flex-col">
                      <p className="font-inter font-normal text-sm leading-6 tracking-normal text-[#000000] mb-2">{`${index + 1}. ${question.question_text
                        }`}</p>
                      <p className="text-blue-500 text-medium font-semibold">Ans: {renderAnwser(question.score_type, question.answer)}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-red-500">{results.message || 'No questions available'}</div>
                )
              ) : (
                <div className="col-span-full text-center text-red-500">{results.message}</div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderSection(userRole)}
      {results.status === true ? (
        <div className="mt-[50px] border-b border-gray-900/10 pb-[30px]">
          <label htmlFor="Notes" className="block text-sm/6 font-semibold text-gray-900">
            Notes
          </label>
          <div>
            <textarea
              id="notes"
              name="notes"
              placeholder="Add notes here"
              rows={4}
              className="mt-2 p-5 w-[80%] block rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              defaultValue={results.status === true ? results.data.notes : ''}
              readOnly
            />
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}
