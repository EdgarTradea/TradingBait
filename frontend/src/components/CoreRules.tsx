import { useState, useEffect } from "react";
import { useUserGuardContext } from "app";
import { getStrategy, saveStrategy, Strategy } from "utils/strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrashIcon, PlusIcon, EditIcon, CheckIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CoreRules() {
  const { user } = useUserGuardContext();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rules, setRules] = useState<string[]>([]);

  useEffect(() => {
    const fetchStrategy = async () => {
      if (user) {
        const userStrategy = await getStrategy(user.uid);
        setStrategy(userStrategy);
        setRules(userStrategy?.rules || []);
      }
    };
    fetchStrategy();
  }, [user]);

  const handleSave = async () => {
    if (user && strategy) {
      const updatedStrategy = { ...strategy, rules };
      await saveStrategy(user.uid, updatedStrategy);
      setStrategy(updatedStrategy);
      setIsEditing(false);
    }
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const handleAddRule = () => {
    setRules([...rules, ""]);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 text-white h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Core Rules</CardTitle>
        {!isEditing ? (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <EditIcon className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleSave}>
            <CheckIcon className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRule(index)}
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="border-gray-700"
              onClick={handleAddRule}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        ) : (
          <ul className="space-y-2 list-disc list-inside">
            {rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
