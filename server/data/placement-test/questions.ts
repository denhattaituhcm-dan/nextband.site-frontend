/**
 * Public Sanitized Question Templates for ARIS Placement Test
 * Contains ZERO answer keys, ZERO confidential scripts.
 * Safe for client-facing test delivery.
 */

export interface SanitizedQuestion {
  id: string;
  skill: "listening" | "reading" | "grammar" | "writing" | "speaking";
  sectionTitle: string;
  questionType: "multiple_choice" | "fill_blank" | "text_area" | "audio_record";
  prompt: string;
  passageText?: string;
  audioUrl?: string;
  options?: string[];
  placeholder?: string;
  orderIndex: number;
}

export interface SanitizedPlacementTestPayload {
  testId: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  skills: {
    listening: {
      title: string;
      audioUrl: string;
      questions: SanitizedQuestion[];
    };
    reading: {
      title: string;
      passage: string;
      questions: SanitizedQuestion[];
    };
    grammar: {
      title: string;
      questions: SanitizedQuestion[];
    };
    writing: {
      title: string;
      prompt: string;
      guidelines: string[];
      minWords: number;
    };
    speaking: {
      title: string;
      part1Questions: string[];
      part2Topic: string;
      part2Cues: string[];
    };
  };
}

export const canonicalPlacementTestPayload: SanitizedPlacementTestPayload = {
  testId: "aris-placement-v1",
  title: "ARIS IELTS-style Diagnostic Assessment (4 Kỹ Năng & Ngữ Pháp)",
  durationMinutes: 45,
  totalQuestions: 37,
  skills: {
    listening: {
      title: "Kỹ năng Nghe (Listening Comprehension)",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
      questions: [
        {
          id: "L1",
          skill: "listening",
          sectionTitle: "Part 1: Thông tin hội thoại thường ngày",
          questionType: "multiple_choice",
          prompt: "Người gọi điện muốn đăng ký tham gia lớp học vào buổi nào?",
          options: ["Thứ Hai & Thứ Tư", "Thứ Ba & Thứ Năm", "Thứ Bảy & Chủ Nhật", "Tất cả các buổi tối"],
          orderIndex: 1,
        },
        {
          id: "L2",
          skill: "listening",
          sectionTitle: "Part 1: Thông tin hội thoại thường ngày",
          questionType: "multiple_choice",
          prompt: "Mức học phí ưu đãi áp dụng trước ngày nào?",
          options: ["Ngày 15 hàng tháng", "Ngày 20 hàng tháng", "Ngày cuối cùng của tháng", "Sau khóa học"],
          orderIndex: 2,
        },
        {
          id: "L3",
          skill: "listening",
          sectionTitle: "Part 1: Thông tin hội thoại thường ngày",
          questionType: "fill_blank",
          prompt: "Địa chỉ chi nhánh trung tâm nằm tại đường: [BLANK]",
          placeholder: "Nhập tên đường nghe được...",
          orderIndex: 3,
        },
        {
          id: "L4",
          skill: "listening",
          sectionTitle: "Part 1: Thông tin hội thoại thường ngày",
          questionType: "multiple_choice",
          prompt: "Tài liệu học tập được cung cấp dưới hình thức nào?",
          options: ["Sách in giấy miễn phí", "Ebook PDF & Audio Portal", "Tự mua ngoài hiệu sách", "Không có tài liệu"],
          orderIndex: 4,
        },
        {
          id: "L5",
          skill: "listening",
          sectionTitle: "Part 1: Thông tin hội thoại thường ngày",
          questionType: "multiple_choice",
          prompt: "Thời lượng mỗi buổi học kéo dài bao lâu?",
          options: ["60 phút", "90 phút", "120 phút", "150 phút"],
          orderIndex: 5,
        },
        {
          id: "L6",
          skill: "listening",
          sectionTitle: "Part 2: Độc thoại học thuật & Hướng dẫn",
          questionType: "multiple_choice",
          prompt: "Mục đích chính của bài thuyết trình là gì?",
          options: [
            "Giới thiệu cơ sở vật chất thư viện",
            "Hướng dẫn phương pháp tự học IELTS hiệu quả",
            "Thông báo lịch thi chuẩn hóa quốc tế",
            "Kêu gọi tham gia câu lạc bộ tiếng Anh",
          ],
          orderIndex: 6,
        },
        {
          id: "L7",
          skill: "listening",
          sectionTitle: "Part 2: Độc thoại học thuật & Hướng dẫn",
          questionType: "multiple_choice",
          prompt: "Người nói nhấn mạnh yếu tố quan trọng nhất để cải thiện phát âm là:",
          options: [
            "Luyện nói thật nhanh",
            "Nắm vững 44 âm IPA và trọng âm từ",
            "Học thuộc nhiều từ vựng hiếm",
            "Chỉ nghe người bản xứ Anh-Anh",
          ],
          orderIndex: 7,
        },
        {
          id: "L8",
          skill: "listening",
          sectionTitle: "Part 2: Độc thoại học thuật & Hướng dẫn",
          questionType: "fill_blank",
          prompt: "Số giờ tự luyện nghe khuyến nghị mỗi ngày là: [BLANK] phút.",
          placeholder: "Nhập số phút...",
          orderIndex: 8,
        },
        {
          id: "L9",
          skill: "listening",
          sectionTitle: "Part 2: Độc thoại học thuật & Hướng dẫn",
          questionType: "multiple_choice",
          prompt: "Khi gặp từ mới trong bài nghe, thí sinh nên:",
          options: [
            "Dừng bài nghe tra từ điển ngay",
            "Dựa vào ngữ cảnh để đoán nghĩa chính",
            "Bỏ qua toàn bộ câu hỏi đó",
            "Chép lại toàn bộ bài nghe",
          ],
          orderIndex: 9,
        },
        {
          id: "L10",
          skill: "listening",
          sectionTitle: "Part 2: Độc thoại học thuật & Hướng dẫn",
          questionType: "multiple_choice",
          prompt: "Tài liệu luyện nghe chính thức được đề xuất là:",
          options: ["Cambridge IELTS Official Series", "Tin tức mạng xã hội", "Phim có phụ đề tiếng Việt", "Truyện tranh song ngữ"],
          orderIndex: 10,
        },
      ],
    },
    reading: {
      title: "Kỹ năng Đọc hiểu (Reading Comprehension)",
      passage: `THE POWER OF DELIBERATE PRACTICE IN LANGUAGE ACQUISITION

Paragraph A
For decades, researchers in cognitive psychology have sought to understand why some language learners achieve near-native fluency within a few years, while others struggle for a decade without significant progress. Traditional theories attributed this divergence to innate linguistic talent or "an ear for languages." However, groundbreaking research led by Dr. Anders Ericsson has revealed that innate ability plays a far smaller role than previously assumed. The decisive factor is a specialized methodology known as "deliberate practice."

Paragraph B
Deliberate practice is fundamentally distinct from passive exposure. Merely watching English movies with subtitles or casually listening to podcasts rarely leads to substantial structural improvement. In contrast, deliberate practice involves breaking down complex skills into well-defined micro-components, executing tasks with intense cognitive focus, and receiving immediate, corrective feedback. In the context of IELTS preparation, this means dissecting complex sentence structures, isolating phonetic errors in speech, and systematically mastering academic collocations.

Paragraph C
A critical element of deliberate practice is operating consistently at the edge of one's current ability — in what educational psychologist Lev Vygotsky termed the "Zone of Proximal Development." If training tasks are too simplistic, the learner enters a state of cognitive complacency where no neural adaptation occurs. Conversely, if tasks are overwhelmingly difficult, cognitive overload impairs retention. Successful language training programs calibrate exercises to be challenging yet achievable with focused effort.

Paragraph D
Furthermore, the retention of academic vocabulary requires spaced repetition rather than massed cramming. Neural pathways strengthening lexical memory undergo consolidation during sleep and intervals of recall. When candidates actively retrieve a new term across expanding time intervals (e.g., 1 day, 3 days, 1 week, 1 month), retention efficiency increases by over 300% compared to traditional rote memorization.`,
      questions: [
        {
          id: "R1",
          skill: "reading",
          sectionTitle: "Reading: Trắc nghiệm ý chính & chi tiết",
          questionType: "multiple_choice",
          prompt: "Theo Đoạn A, yếu tố quyết định sự thành công trong việc tiếp thu ngôn ngữ là gì?",
          options: [
            "Năng khiếu bẩm sinh đặc biệt",
            "Phương pháp luyện tập có chủ đích (Deliberate practice)",
            "Số năm sinh sống tại nước ngoài",
            "Bắt đầu học tiếng Anh từ khi còn nhỏ",
          ],
          orderIndex: 11,
        },
        {
          id: "R2",
          skill: "reading",
          sectionTitle: "Reading: Trắc nghiệm ý chính & chi tiết",
          questionType: "multiple_choice",
          prompt: "Hoạt động nào sau đây bị xem là 'tiếp xúc thụ động' (passive exposure)?",
          options: [
            "Xem phim có phụ đề mà không phân tích cấu trúc câu",
            "Phân tích lỗi sai phát âm cùng giảng viên",
            "Học collocations theo bảng danh mục học thuật",
            "Ghi âm và so sánh giọng với người bản xứ",
          ],
          orderIndex: 12,
        },
        {
          id: "R3",
          skill: "reading",
          sectionTitle: "Reading: Trắc nghiệm ý chính & chi tiết",
          questionType: "multiple_choice",
          prompt: "Khái niệm 'Zone of Proximal Development' (Vùng phát triển gần nhất) có ý nghĩa là:",
          options: [
            "Luyện tập những bài dễ để duy trì sự tự tin",
            "Thực hiện các bài tập ở ngưỡng thử thách vừa phải, đòi hỏi sự tập trung",
            "Học những tài liệu khó nhất để tạo áp lực tối đa",
            "Chỉ học nhóm mà không cần tự học độc lập",
          ],
          orderIndex: 13,
        },
        {
          id: "R4",
          skill: "reading",
          sectionTitle: "Reading: Trắc nghiệm ý chính & chi tiết",
          questionType: "multiple_choice",
          prompt: "Đoạn D giải thích rằng kỹ thuật Spaced Repetition (Lặp lại ngắt quãng) giúp:",
          options: [
            "Tăng hiệu quả ghi nhớ từ vựng lên hơn 300%",
            "Học được 100 từ mới mỗi ngày không cần ôn",
            "Thay thế hoàn toàn việc luyện phát âm",
            "Giảm thời gian ngủ của người học",
          ],
          orderIndex: 14,
        },
        {
          id: "R5",
          skill: "reading",
          sectionTitle: "Reading: Xác định thông tin Đúng/Sai/Không đề cập",
          questionType: "multiple_choice",
          prompt: "Thông tin: 'Dr. Anders Ericsson cho rằng năng khiếu bẩm sinh đóng vai trò quan trọng nhất trong việc giỏi ngoại ngữ.' là:",
          options: ["TRUE (Đúng)", "FALSE (Sai)", "NOT GIVEN (Không có trong bài)"],
          orderIndex: 15,
        },
        {
          id: "R6",
          skill: "reading",
          sectionTitle: "Reading: Xác định thông tin Đúng/Sai/Không đề cập",
          questionType: "multiple_choice",
          prompt: "Thông tin: 'Quá trình củng cố trí nhớ từ vựng diễn ra trong giấc ngủ và các khoảng thời gian truy xuất lặp lại.' là:",
          options: ["TRUE (Đúng)", "FALSE (Sai)", "NOT GIVEN (Không có trong bài)"],
          orderIndex: 16,
        },
        {
          id: "R7",
          skill: "reading",
          sectionTitle: "Reading: Xác định thông tin Đúng/Sai/Không đề cập",
          questionType: "multiple_choice",
          prompt: "Thông tin: 'Hầu hết các trường đại học tại Anh đã áp dụng phương pháp của Vygotsky vào chương trình giảng dạy.' là:",
          options: ["TRUE (Đúng)", "FALSE (Sai)", "NOT GIVEN (Không có trong bài)"],
          orderIndex: 17,
        },
        {
          id: "R8",
          skill: "reading",
          sectionTitle: "Reading: Điền từ vào đoạn tóm tắt",
          questionType: "fill_blank",
          prompt: "Deliberate practice requires immediate and [BLANK] feedback to correct mistakes.",
          placeholder: "Nhập 1 từ chính xác từ bài đọc...",
          orderIndex: 18,
        },
        {
          id: "R9",
          skill: "reading",
          sectionTitle: "Reading: Điền từ vào đoạn tóm tắt",
          questionType: "fill_blank",
          prompt: "When tasks are overly simple, the learner enters a state of cognitive [BLANK].",
          placeholder: "Nhập 1 từ chính xác từ bài đọc...",
          orderIndex: 19,
        },
        {
          id: "R10",
          skill: "reading",
          sectionTitle: "Reading: Ghép tiêu đề đoạn văn",
          questionType: "multiple_choice",
          prompt: "Tiêu đề phù hợp nhất cho Đoạn B là:",
          options: [
            "The Core Characteristics of Deliberate Practice",
            "Why Entertainment is the Best Learning Tool",
            "The Biography of Dr. Anders Ericsson",
            "History of Psychological Research",
          ],
          orderIndex: 20,
        },
      ],
    },
    grammar: {
      title: "Chẩn đoán Ngữ pháp & Từ vựng (Grammar & Lexicon)",
      questions: [
        {
          id: "G1",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Thì & Cấu trúc câu",
          questionType: "multiple_choice",
          prompt: "By the time the new policy is implemented next year, the committee _____ the evaluation.",
          options: ["will have completed", "completed", "has completed", "will complete"],
          orderIndex: 21,
        },
        {
          id: "G2",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Câu điều kiện & Mệnh đề",
          questionType: "multiple_choice",
          prompt: "Had the government invested more in green energy, pollution levels _____ so dramatically.",
          options: ["would not rise", "would not have risen", "will not rise", "have not risen"],
          orderIndex: 22,
        },
        {
          id: "G3",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Mệnh đề quan hệ & Rút gọn",
          questionType: "multiple_choice",
          prompt: "The research team published a report _____ the environmental impact of urban expansion.",
          options: ["highlighting", "highlighted", "which highlight", "was highlighted"],
          orderIndex: 23,
        },
        {
          id: "G4",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Đảo ngữ (Inversion)",
          questionType: "multiple_choice",
          prompt: "Not only _____ to reduce operational costs, but it also enhanced customer satisfaction.",
          options: ["the system helped", "did the system help", "the system had helped", "helping the system"],
          orderIndex: 24,
        },
        {
          id: "G5",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Thể bị động & Tân ngữ",
          questionType: "multiple_choice",
          prompt: "The newly discovered manuscript is widely believed _____ in the early sixteenth century.",
          options: ["to write", "to have been written", "having written", "being written"],
          orderIndex: 25,
        },
        {
          id: "G6",
          skill: "grammar",
          sectionTitle: "Từ vựng Học thuật: Academic Collocations",
          questionType: "multiple_choice",
          prompt: "Rapid industrialization has _____ a profound impact on local biodiversity.",
          options: ["exerted", "committed", "taken", "conducted"],
          orderIndex: 26,
        },
        {
          id: "G7",
          skill: "grammar",
          sectionTitle: "Từ vựng Học thuật: Academic Collocations",
          questionType: "multiple_choice",
          prompt: "The university decided to _____ a comprehensive survey regarding student mental health.",
          options: ["conduct", "perform", "make", "enforce"],
          orderIndex: 27,
        },
        {
          id: "G8",
          skill: "grammar",
          sectionTitle: "Từ vựng Học thuật: Liên từ & Logic",
          questionType: "multiple_choice",
          prompt: "The initial investment was substantial; _____, the long-term economic gains proved undeniable.",
          options: ["furthermore", "nonetheless", "conversely", "meanwhile"],
          orderIndex: 28,
        },
        {
          id: "G9",
          skill: "grammar",
          sectionTitle: "Từ vựng Học thuật: Prepositions & Phrasal Verbs",
          questionType: "multiple_choice",
          prompt: "Students who adhere _____ a strict study schedule consistently outperform their peers.",
          options: ["to", "with", "for", "at"],
          orderIndex: 29,
        },
        {
          id: "G10",
          skill: "grammar",
          sectionTitle: "Từ vựng Học thuật: Paraphrasing & Lexicon",
          questionType: "multiple_choice",
          prompt: "Choose the word CLOSEST in meaning to 'ubiquitous' in: 'Smartphones have become ubiquitous in modern society.'",
          options: ["omnipresent / widespread", "expensive", "obsolete", "complicated"],
          orderIndex: 30,
        },
        {
          id: "G11",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Subject-Verb Agreement",
          questionType: "multiple_choice",
          prompt: "The number of students enrolling in online certification courses _____ steadily over the past three years.",
          options: ["have increased", "has increased", "are increasing", "were increasing"],
          orderIndex: 31,
        },
        {
          id: "G12",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Cleft Sentences (Câu chẻ)",
          questionType: "multiple_choice",
          prompt: "It was the lack of infrastructure _____ hindered the economic development of the remote region.",
          options: ["which", "that", "what", "whom"],
          orderIndex: 32,
        },
        {
          id: "G13",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Gerund vs Infinitive",
          questionType: "multiple_choice",
          prompt: "The municipal authority is actively considering _____ renewable energy subsidies for households.",
          options: ["to introduce", "introducing", "introduce", "having introduced"],
          orderIndex: 33,
        },
        {
          id: "G14",
          skill: "grammar",
          sectionTitle: "Từ vựng Học thuật: Word Form",
          questionType: "multiple_choice",
          prompt: "The company's failure to adapt to digital transformation led to its _____ decline in market share.",
          options: ["subsequent", "subsequently", "subsequence", "subsequencing"],
          orderIndex: 34,
        },
        {
          id: "G15",
          skill: "grammar",
          sectionTitle: "Ngữ pháp: Parallel Structure",
          questionType: "multiple_choice",
          prompt: "Effective leadership involves setting clear expectations, fostering collaboration, and _____ transparent communication.",
          options: ["maintain", "to maintain", "maintaining", "maintenance"],
          orderIndex: 35,
        },
      ],
    },
    writing: {
      title: "Chẩn đoán Viết (Diagnostic Writing)",
      prompt: "Some people believe that university education should be completely free for all citizens, while others argue that students should pay tuition fees. Write a short response (100–150 words) expressing your point of view with at least 2 clear supporting reasons.",
      guidelines: [
        "Nêu rõ quan điểm của bạn ngay ở câu mở đoạn.",
        "Sử dụng ít nhất 2 luận điểm kèm ví dụ hoặc giải thích ngắn gọn.",
        "Cố gắng áp dụng câu ghép / câu phức và các liên từ logic (However, Furthermore, Consequently...).",
      ],
      minWords: 80,
    },
    speaking: {
      title: "Chẩn đoán Nói (Diagnostic Speaking)",
      part1Questions: [
        "1. Can you tell me about your daily routine and what part of the day you enjoy the most?",
        "2. How do you usually study or practice English in your free time?",
      ],
      part2Topic: "Describe an important goal or ambition you have set for yourself recently.",
      part2Cues: [
        "What the goal is",
        "When and why you decided to pursue it",
        "What steps you need to take to accomplish it",
        "And explain how achieving this goal will change your life.",
      ],
    },
  },
};
